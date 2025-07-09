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
const {
  EnumPaymentStatus,
  EnumSubscriptionPlanDuration,
  EnumSubscriptionStatus,
} = require("../../../util/enum");
const User = require("../user/User");
const postNotification = require("../../../util/postNotification");

const stripe = require("stripe")(config.stripe.stripe_secret_key);
// const endPointSecret = config.stripe.stripe_webhook_secret_test;
const endPointSecret = config.stripe.stripe_webhook_secret_production;
// stripe_backup_code = ezgr-nkkm-cmdc-naja-wubc

const postCheckout = async (userData, payload) => {
  validateFields(payload, ["subscriptionId"]);

  // check if user is already subscribed
  // const user = await User.findById(userData.userId).lean();

  // if (user.isSubscribed)
  //   throw new ApiError(status.BAD_REQUEST, "User is already subscribed");

  const subscriptionPlan = await SubscriptionPlan.findById(
    payload.subscriptionId
  ).lean();

  if (!subscriptionPlan)
    throw new ApiError(status.NOT_FOUND, "SubscriptionPlan not found");

  let session = {};
  const amountInCents = Math.ceil(
    Number(subscriptionPlan.price).toFixed(2) * 100
  );
  const amount = amountInCents / 100;

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
          unit_amount: amountInCents,
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
  const subscriptionStartDate = new Date();
  const subscriptionEndDate = getEndDate(subscriptionPlan.duration);

  const paymentData = {
    user: userData.userId,
    amount,
    checkout_session_id,
    subscriptionPlan: subscriptionPlan._id,
    status: EnumPaymentStatus.UNPAID,
    subscriptionStartDate,
    subscriptionEndDate,
  };

  const payment = await Payment.create(paymentData);

  return url;
};

const webhookManager = async (req) => {
  console.log("Request Body:=====================================", req.body);
  const sig = req.headers["stripe-signature"];
  console.log(
    "Content-Type:=====================================",
    req.headers["content-type"]
  );
  console.log("Signature:=====================================", sig);

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
    const { id: checkout_session_id, payment_intent } = webhookEventData;

    // update payment
    const payment = await Payment.findOneAndUpdate(
      { checkout_session_id: checkout_session_id },
      {
        $set: {
          payment_intent_id: payment_intent,
          status: EnumPaymentStatus.SUCCEEDED,
          subscriptionStatus: EnumSubscriptionStatus.ACTIVE,
        },
      },
      { new: true, runValidators: true }
    ).populate([
      {
        path: "subscriptionPlan",
        select: "subscriptionType price duration",
      },
    ]);

    // update user subscription
    // calculate and stamp subscriptionStartDate and subscriptionEndDate date based on the duration
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = getEndDate(payment.subscriptionPlan.duration);

    const updateUserData = {
      $set: {
        isSubscribed: true,
        subscriptionPlan: payment.subscriptionPlan,
        subscriptionStartDate,
        subscriptionEndDate,
      },
    };

    const updatedUser = await User.findByIdAndUpdate(
      payment.user,
      updateUserData,
      { new: true, runValidators: true }
    );

    // send email to user
    const emailData = {
      name: updatedUser.name,
      subscriptionPlan: payment.subscriptionPlan.subscriptionType,
      price: payment.amount,
      currency: "USD",
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      payment_intent_id: payment_intent,
    };

    EmailHelpers.sendSubscriptionEmail(updatedUser.email, emailData);

    // send notification
    postNotification(
      "Subscription Success",
      "Your subscription has been successfully updated.",
      updatedUser._id
    );

    postNotification(
      "New Subscriber",
      "BetWise Picks got a new subscriber. Check it out!"
    );
  } catch (error) {
    console.log(error);
    errorLogger.error(error.message);
  }
};

const getEndDate = (duration) => {
  switch (duration) {
    case EnumSubscriptionPlanDuration.DAILY:
      return new Date(new Date().setDate(new Date().getDate() + 1)); //  first hour of next day
    case EnumSubscriptionPlanDuration.MONTHLY:
      return new Date(new Date().setMonth(new Date().getMonth() + 1)); //  first hour of next month
    case EnumSubscriptionPlanDuration.YEARLY:
      return new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // first hour of next year
    default:
      throw new ApiError(status.BAD_REQUEST, "Invalid duration");
  }
};

// Delete unpaid payments
const deleteUnpaidPayments = catchAsync(async () => {
  const paymentDeletionResult = await Payment.deleteMany({
    status: EnumPaymentStatus.UNPAID,
  });

  if (paymentDeletionResult.deletedCount > 0) {
    logger.info(
      `Deleted ${paymentDeletionResult.deletedCount} unpaid payments`
    );
  }
});

// Update expired subscriptions
const updateExpiredSubscriptions = catchAsync(async () => {
  const expiredSubscriptions = await Payment.updateMany(
    {
      subscriptionStatus: EnumSubscriptionStatus.ACTIVE,
      subscriptionEndDate: { $lt: new Date() },
    },
    {
      $set: {
        subscriptionStatus: EnumSubscriptionStatus.EXPIRED,
      },
    }
  );

  if (expiredSubscriptions.modifiedCount > 0) {
    logger.info(
      `Updated ${expiredSubscriptions.modifiedCount} expired subscriptions`
    );
  }
});

// update user subscription status
const updateUserSubscriptionStatus = catchAsync(async () => {
  const subscriptionExpiredUsers = await User.find({
    isSubscribed: true,
    subscriptionEndDate: { $lt: new Date() },
  });

  const emailOfExpiredUsers = subscriptionExpiredUsers.map(
    (user) => user.email
  );

  // send email to each expired user
  emailOfExpiredUsers.forEach((email) => {
    EmailHelpers.sendSubscriptionExpiredEmail(email);
    console.log("email sent to", email);
  });

  const updatedUser = await User.updateMany(
    {
      isSubscribed: true,
      subscriptionEndDate: { $lt: new Date() },
    },
    {
      $set: {
        isSubscribed: false,
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      },
    }
  );

  if (updatedUser.modifiedCount > 0) {
    logger.info(
      `Updated user ${updatedUser.modifiedCount} subscription status`
    );
  }
});

// Run cron job every day at midnight
cron.schedule("0 0 * * *", () => {
  // cron.schedule("* * * * *", () => {
  deleteUnpaidPayments();
  updateExpiredSubscriptions();
  updateUserSubscriptionStatus();
});

const StripeService = {
  postCheckout,
  webhookManager,
};

module.exports = StripeService;
