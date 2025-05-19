const { default: status } = require("http-status");
const cron = require("node-cron");
const config = require("../../../config");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const Payment = require("./Payment");
const EmailHelpers = require("../../../util/emailHelpers");
const { response } = require("express");
const { logger, errorLogger } = require("../../../util/logger");
const catchAsync = require("../../../util/catchAsync");
const SubscriptionPlan = require("../subscriptionPlan/SubscriptionPlan");
const { EnumPaymentStatus } = require("../../../util/enum");

const stripe = require("stripe")(config.stripe.stripe_secret_key);
// const endPointSecret = config.stripe.end_point_secret;

const postCheckout = async (userData, payload) => {
  validateFields(payload, ["subscriptionId"]);

  const subscriptionPlan = await SubscriptionPlan.findById(
    payload.subscriptionId
  ).lean();

  if (!subscriptionPlan)
    throw new ApiError(status.NOT_FOUND, "SubscriptionPlan not found");

  let session = {};
  const amount = Math.ceil(Number(subscriptionPlan.price).toFixed(2) * 100);

  const sessionData = {
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `http://${config.base_url}:${config.port}/payment/success`,
    cancel_url: `http://${config.base_url}:${config.port}/payment/cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Subscription Fee",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
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
    user: userData.userId,
    amount,
    checkout_session_id,
    subscriptionPlan: subscriptionPlan._id,
    status: EnumPaymentStatus.UNPAID,
  };

  const payment = await Payment.create(paymentData);

  return url;
};

// const webhookManager = async (req) => {
//   const sig = req.headers["stripe-signature"];
//   console.log("Content-Type:", req.headers["content-type"]);

//   let event;
//   const date = new Date();

//   console.log("webhook hit");

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endPointSecret);
//   } catch (error) {
//     console.log(error);
//     response.status(400).send(`Webhook error: ${error.message}`);
//     return;
//   }

//   switch (event.type) {
//     case "checkout.session.completed":
//       updatePaymentAndRelatedAndSendMail(event.data.object);
//       break;
//     default:
//       console.log(
//         `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} Unhandled event type (${
//           event.type
//         })`
//       );
//   }
// };

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
  postCheckout,
};

module.exports = StripeService;
