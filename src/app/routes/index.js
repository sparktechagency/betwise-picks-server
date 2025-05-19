const express = require("express");
const router = express.Router();
const AuthRoutes = require("../module/auth/auth.routes");
const AdminRoutes = require("../module/admin/admin.routes");
const SuperAdminRoutes = require("../module/superAdmin/superAdmin.routes");
const UserRoutes = require("../module/user/user.routes");
const DashboardRoutes = require("../module/dashboard/dashboard.routes");
const ManageRoutes = require("../module/manage/manage.routes");
const NotificationRoutes = require("../module/notification/notification.routes");
const FeedbackRoutes = require("../module/feedback/feedback.routes");
const ReviewRoutes = require("../module/review/review.routes");
const PostRoutes = require("../module/post/post.routes");
const SubscriptionPlanRoutes = require("../module/subscriptionPlan/subscriptionPlan.routes");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/super-admin",
    route: SuperAdminRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/manage",
    route: ManageRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoutes,
  },
  {
    path: "/feedback",
    route: FeedbackRoutes,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },
  {
    path: "/post",
    route: PostRoutes,
  },
  {
    path: "/subscription-plan",
    route: SubscriptionPlanRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
