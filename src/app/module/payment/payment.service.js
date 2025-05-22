const { status } = require("http-status");

const ApiError = require("../../../error/ApiError");
const QueryBuilder = require("../../../builder/queryBuilder");
const Payment = require("./Payment");
const { EnumPaymentStatus } = require("../../../util/enum");

const getAllPayment = async (query) => {
  const paymentQuery = new QueryBuilder(
    Payment.find({ status: EnumPaymentStatus.SUCCEEDED }).populate([
      "user",
      "subscriptionPlan",
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
