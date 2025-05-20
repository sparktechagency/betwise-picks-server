const StripeService = require("./stripe.service");
const { PaymentService } = require("./payment.service");
const sendResponse = require("../../../util/sendResponse");
const catchAsync = require("../../../util/catchAsync");

const successPage = catchAsync(async (req, res) => {
  res.render("success.ejs");
});

const cancelPage = catchAsync(async (req, res) => {
  res.render("cancel.ejs");
});

const postCheckout = catchAsync(async (req, res) => {
  const result = await StripeService.postCheckout(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment for subscription initialized",
    data: result,
  });
});

const webhookManager = catchAsync(async (req, res) => {
  await StripeService.webhookManager(req);
  res.send();
});

const getAllPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.getAllPayment(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment retrieval Successful",
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.getSinglePayment(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment retrieved",
    data: result,
  });
});

const PaymentController = {
  successPage,
  cancelPage,
  postCheckout,
  webhookManager,
  getAllPayment,
  getSinglePayment,
};

module.exports = { PaymentController };
