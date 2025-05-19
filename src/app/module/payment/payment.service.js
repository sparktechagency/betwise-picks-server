const { status } = require("http-status");

const ApiError = require("../../../error/ApiError");
const QueryBuilder = require("../../../builder/queryBuilder");
const Payment = require("./payment.model");

const getAllPayment = async (query) => {
  const paymentQuery = new QueryBuilder(
    Payment.find({ status: ENUM_PAYMENT_STATUS.SUCCEEDED }).populate([
      {
        path: "user",
        select: "-_id name profile_image phoneNumber",
      },
      {
        path: "host",
        select: "-_id name profile_image phoneNumber",
      },
      {
        path: "event",
        select: "-_id eventName",
      },
      {
        path: "track",
        select: "-_id trackName",
      },
    ]),
    query
  )
    .search(["checkout_session_id", "payment_intent_id"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    paymentQuery.modelQuery,
    paymentQuery.countTotal(),
  ]);

  return {
    meta,
    result,
  };
};

const getSinglePaymentInfo = async (query) => {};

const PaymentService = {
  getAllPayment,
  getSinglePaymentInfo,
};

module.exports = { PaymentService };
