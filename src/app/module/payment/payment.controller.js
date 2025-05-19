const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchAsync");
const StripeService = require("./stripe.service");
const { PaymentService } = require("./payment.service");

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
    message: "Payment info retrieved",
    data: result,
  });
});

const PaymentController = {
  successPage,
  cancelPage,
  returnPage,
  postCheckout,
  webhookManager,
  getAllPayment,
  getSinglePayment,
};

module.exports = { PaymentController };
