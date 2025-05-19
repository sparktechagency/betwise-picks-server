const express = require("express");
const { PaymentController } = require("./payment.controller");

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  PaymentController.webhookManager
);

module.exports = router;
