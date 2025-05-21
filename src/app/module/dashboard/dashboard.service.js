const { default: status } = require("http-status");
const Announcement = require("./Announcement");
const validateFields = require("../../../util/validateFields");
const Payment = require("../payment/Payment");
const { EnumPaymentStatus } = require("../../../util/enum");
const Auth = require("../auth/Auth");
const User = require("../user/User");
const Admin = require("../admin/Admin");
const Post = require("../post/Post");

const getRevenue = async (query) => {
  const { year: strYear } = query;

  const year = Number(strYear);
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const [distinctYears, revenue] = await Promise.all([
    Payment.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          year: "$_id",
          _id: 0,
        },
      },
    ]),

    Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          status: EnumPaymentStatus.SUCCEEDED,
        },
      },
      {
        $project: {
          amount: 1,
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),
  ]);

  const totalYears = distinctYears.map((item) => item.year);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlyRevenue = monthNames.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {});

  revenue.forEach((r) => {
    const monthName = monthNames[r._id - 1];
    monthlyRevenue[monthName] = r.totalRevenue;
  });

  return {
    total_years: totalYears,
    monthlyRevenue,
  };
};

const getTotalOverview = async () => {
  const [
    totalAuth,
    totalUser,
    totalSubscribedUsers,
    totalUnsubscribedUsers,
    totalAdmin,
    totalPosts,
  ] = await Promise.all([
    Auth.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ isSubscribed: true }),
    User.countDocuments({ isSubscribed: false }),
    Admin.countDocuments(),
    Post.countDocuments(),
  ]);

  return {
    totalAuth,
    totalUser,
    totalSubscribedUsers,
    totalUnsubscribedUsers,
    totalAdmin,
    totalPosts,
  };
};

const getGrowth = async (query) => {
  const { year: yearStr, role } = query;

  validateFields(query, ["role", "year"]);

  const year = Number(yearStr);
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("en", { month: "long" })
  );

  // Aggregate monthly registration counts and list of all years
  const [monthlyRegistration, distinctYears] = await Promise.all([
    Auth.aggregate([
      {
        $match: {
          role: role,
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]),
    Auth.aggregate([
      {
        $match: {
          role: role,
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
        },
      },
      {
        $project: {
          year: "$_id",
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
        },
      },
    ]),
  ]);

  const total_years = distinctYears.map((item) => item.year);

  // Initialize result object with all months set to 0
  const result = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

  // Populate result with actual registration counts
  monthlyRegistration.forEach(({ month, count }) => {
    result[months[month - 1]] = count;
  });

  return {
    total_years,
    monthlyRegistration: result,
  };
};

// announcement ======================

const getAnnouncement = async () => {
  const announcement = await Announcement.findOne().lean();
  return announcement;
};

const updateAnnouncement = async (payload) => {
  const updateFields = {
    ...(payload.title && { title: payload.title }),
    ...(payload.description && { description: payload.description }),
  };

  if (Object.keys(updateFields).length === 0)
    throw new ApiError(status.BAD_REQUEST, "No fields to update");

  const announcement = await Announcement.findOneAndUpdate({}, updateFields, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  return announcement;
};

const updateToggleAnnouncement = async (payload) => {
  validateFields(payload, ["isActive"]);

  const announcement = await Announcement.findOneAndUpdate(
    {},
    { isActive: payload.isActive },
    {
      new: true,
      runValidators: true,
    }
  );

  return announcement;
};

const DashboardService = {
  getRevenue,
  getTotalOverview,
  getGrowth,

  getAnnouncement,
  updateAnnouncement,
  updateToggleAnnouncement,
};

module.exports = DashboardService;
