const express = require("express");
const auth = require("../../middleware/auth");
const { PaymentController } = require("./payment.controller");
const { auth_level } = require("../../../config");

const router = express.Router();

router
  .get("/success", PaymentController.successPage)
  .get("/cancel", PaymentController.cancelPage)
  .post("/post-checkout", auth(auth_level.user), PaymentController.postCheckout)
  .get(
    "/get-all-payment",
    auth(auth_level.admin),
    PaymentController.getAllPayment
  )
  .get(
    "/get-single-payment",
    auth(auth_level.admin),
    PaymentController.getSinglePayment
  )
  .patch(
    "/update-subscription-status-for-app-user",
    auth(auth_level.user),
    PaymentController.updateSubscriptionStatusForAppUser
  );

module.exports = router;
