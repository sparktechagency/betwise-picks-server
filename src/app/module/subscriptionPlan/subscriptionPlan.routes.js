const express = require("express");
const auth = require("../../middleware/auth");
const config = require("../../../config");
const SubscriptionPlanController = require("./subscriptionPlan.controller");

const router = express.Router();

router
  .post(
    "/post-subscriptionPlan",
    auth(config.auth_level.user),
    SubscriptionPlanController.postSubscriptionPlan
  )
  .get(
    "/get-subscriptionPlan",
    auth(config.auth_level.user),
    SubscriptionPlanController.getSubscriptionPlan
  )
  .get(
    "/get-all-subscriptionPlans",
    auth(config.auth_level.user),
    SubscriptionPlanController.getAllSubscriptionPlans
  )
  .patch(
    "/update-subscriptionPlan",
    auth(config.auth_level.user),
    SubscriptionPlanController.updateSubscriptionPlan
  )
  .delete(
    "/delete-subscriptionPlan",
    auth(config.auth_level.user),
    SubscriptionPlanController.deleteSubscriptionPlan
  );

module.exports = router;
