const { default: status } = require("http-status");
const cron = require("node-cron");
const config = require("../../../config");
const ApiError = require("../../../error/ApiError");
const { errorLogger } = require("../../../shared/logger");
const validateFields = require("../../../util/validateFields");
const {
  ENUM_BUSINESS_TYPE,
  ENUM_PAYMENT_STATUS,
} = require("../../../util/enum");
const Payment = require("./payment.model");
const EmailHelpers = require("../../../util/emailHelpers");
const catchAsync = require("../../../shared/catchAsync");
const { response } = require("express");

const stripe = require("stripe")(config.stripe.secret_key);
const endPointSecret = config.stripe.end_point_secret;

const createCheckout = async (userData, payload) => {
  /**
   * Creates a Stripe checkout session for booking payments.
   *
   * This function is responsible for processing payments when a user books an event or track slot.
   * It validates the provided booking details, calculates the necessary fees, and creates a Stripe
   * checkout session with the appropriate payment details.
   *
   * Functionality:
   * - Validates required fields in the payload.
   * - Ensures only one of `bookingId` or `bookingIds` is provided.
   * - Retrieves the booking details and verifies its existence.
   * - Fetches payout information and validates the associated business (event or track).
   * - Calculates platform fees, Stripe fees, and the final payable amount.
   * - Creates a Stripe checkout session with relevant payment details and payout information.
   * - Saves payment details in the database.
   * - Returns the Stripe checkout session URL for the frontend to redirect the user for payment.
   *
   * Usage:
   * - This function is triggered when a user attempts to pay for a booking.
   * - It ensures the correct amount is charged, platform fees are deducted, and the host receives
   *   their share of the payment.
   * - Provides a secure and structured payment flow via Stripe.
   */

  validateFields(payload, ["amount", "currency"]);

  const { userId } = userData;
  const {
    bookingId: singleBookingId,
    bookingIds,
    amount: prevAmount,
  } = payload || {};

  if (!singleBookingId && !bookingIds)
    throw new ApiError(status.BAD_REQUEST, "Missing bookingId or bookingIds");
  if (singleBookingId && bookingIds)
    throw new ApiError(status.BAD_REQUEST, "Only one: bookingId or bookingIds");

  const bookingId = singleBookingId ? singleBookingId : bookingIds[0];

  const amountInCents = Number(prevAmount) * 100;
  let session = {};

  // const currency = currencyValidator(payload.currency);

  // validate booking
  const booking = await Booking.findById(bookingId)
    .select("user host event eventSlot track trackSlot currency")
    .lean();

  if (!booking) throw new ApiError(status.NOT_FOUND, "Booking not found");

  // validate payoutInfo and business
  const isEventBooking = Boolean(booking.event);
  const Model = isEventBooking ? Event : Track;
  const businessId = isEventBooking ? booking.event : booking.track;
  let [payoutInfo, business] = await Promise.all([
    PayoutInfo.findOne({ host: booking.host }),
    Model.findById(businessId).select("_id").lean(),
  ]);

  if (!payoutInfo) throw new ApiError(status.NOT_FOUND, "PayoutInfo not found");
  if (!business) throw new ApiError(status.NOT_FOUND, "Booking not found");

  const platformFee = amountInCents * 0.05;
  const payableAmount = amountInCents + platformFee;
  const stripeFee = payableAmount * 0.029;
  const halfOfStripeFee = stripeFee / 2;
  const platformAmount = platformFee - halfOfStripeFee;
  const hostAmount = amountInCents - halfOfStripeFee;

  const sessionData = {
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `http://${config.base_url}:${config.port}/payment/success`,
    cancel_url: `http://${config.base_url}:${config.port}/payment/cancel`,
    line_items: [
      {
        price_data: {
          currency: payload.currency,
          product_data: {
            name: "Amount",
            description: `Platform Fee: ${platformFee / 100} ${
              payload.currency
            }`,
          },
          unit_amount: Math.round(payableAmount),
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: Math.round(platformAmount),
      transfer_data: {
        destination: payoutInfo.stripe_account_id,
      },
      on_behalf_of: payoutInfo.stripe_account_id,
    },
  };

  try {
    session = await stripe.checkout.sessions.create(sessionData);
  } catch (error) {
    console.log(error);
    errorLogger.error(error.message);
    throw new ApiError(status.BAD_REQUEST, error.message);
  }

  const { id: checkout_session_id, url } = session || {};

  const paymentData = {
    ...(isEventBooking && {
      event: businessId,
      eventSlot: booking.eventSlot,
      businessType: ENUM_BUSINESS_TYPE.EVENT,
    }),
    ...(!isEventBooking && {
      bookingId: singleBookingId,
      track: businessId,
      trackSlot: booking.trackSlot,
      businessType: ENUM_BUSINESS_TYPE.TRACK,
    }),
    user: userId,
    host: booking.host,
    amount: prevAmount,
    currency: payload.currency,
    checkout_session_id,
  };

  if (isEventBooking && payload.bookingId)
    paymentData.bookingId = payload.bookingId;
  if (isEventBooking && payload.bookingIds)
    paymentData.bookingIds = payload.bookingIds;

  const payment = await Payment.create(paymentData);

  return url;
};

const webhookManager = async (req) => {
  const sig = req.headers["stripe-signature"];
  console.log("Content-Type:", req.headers["content-type"]);

  let event;
  const date = new Date();

  console.log("webhook hit");

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endPointSecret);
  } catch (error) {
    console.log(error);
    response.status(400).send(`Webhook error: ${error.message}`);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed":
      updatePaymentAndRelatedAndSendMail(event.data.object);
      break;
    default:
      console.log(
        `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} Unhandled event type (${
          event.type
        })`
      );
  }
};

// ** utility function
const updatePaymentAndRelatedAndSendMail = async (webhookEventData) => {
  try {
    const { id, payment_intent } = webhookEventData;
    const emailData = {
      name: updatedBooking.user.name,
      subscriptionPlan: updatedBooking.subscriptionPlan,
      price: updatedBooking.price,
      currency: updatedBooking.currency,
      startDate: updatedBooking.startDate,
      endDate: updatedBooking.endDate,
      payment_intent_id: payment_intent_id,
    };

    EmailHelpers.sendBookingEmail(updatedBooking.user.email, emailData);
  } catch (error) {
    console.log(error);
    errorLogger.error(error.message);
  }
};

// Delete unpaid payments and bookings every day at midnight
cron.schedule(
  "0 0 * * *",
  catchAsync(async () => {
    const [paymentDeletionResult] = await Promise.all([
      Payment.deleteMany({
        status: ENUM_PAYMENT_STATUS.UNPAID,
      }),
    ]);

    if (paymentDeletionResult.deletedCount > 0) {
      logger.info(
        `Deleted ${paymentDeletionResult.deletedCount} unpaid payments`
      );
    }
  })
);

const StripeService = {
  onboarding,
  createCheckout,
  webhookManager,
};

module.exports = StripeService;
