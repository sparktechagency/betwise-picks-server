const { default: status } = require("http-status");
const Announcement = require("./Announcement");
const validateFields = require("../../../util/validateFields");

const getRevenue = async (query) => {
  const { year: strYear } = query;

  validateFields(query, ["year"]);

  const year = Number(strYear);
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);
  const result = await Payment.aggregate([
    {
      $facet: {
        distinctYears: [
          {
            $group: {
              _id: { $year: "$createdAt" },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              year: "$_id",
              _id: 0,
            },
          },
        ],
        monthlyRevenue: [
          {
            $match: {
              createdAt: { $gte: startDate, $lt: endDate },
              paymentFor: "coin_purchase", // ✅ make sure to filter if needed
              status: EnumPaymentStatus.SUCCEEDED,
            },
          },
          {
            $project: {
              amountForCoinPurchase: 1,
              month: { $month: "$createdAt" },
            },
          },
          {
            $group: {
              _id: "$month",
              totalRevenue: { $sum: "$amountForCoinPurchase" },
            },
          },
          {
            $sort: { _id: 1 },
          },
        ],
        totalRevenueAllTime: [
          {
            $match: {
              paymentFor: EnumPaymentFor.COIN_PURCHASE,
              status: EnumPaymentStatus.SUCCEEDED,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amountForCoinPurchase" },
            },
          },
        ],
        tripRevenueBreakdown: [
          {
            $match: {
              paymentFor: "trip",
              status: EnumPaymentStatus.SUCCEEDED,
            },
          },
          {
            $group: {
              _id: "$paymentType", // cash / coin
              total: {
                $sum: {
                  $add: [
                    { $ifNull: ["$amountInCash", 0] },
                    { $ifNull: ["$amountInCoins", 0] },
                  ],
                },
              },
            },
          },
          {
            $sort: { total: 1 },
          },
        ],
      },
    },
  ]);

  const {
    distinctYears = [],
    monthlyRevenue = [],
    totalRevenueAllTime = [],
    tripRevenueBreakdown = [],
  } = result[0] || {};

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

  const monthlyRevenueObj = monthNames.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {});

  monthlyRevenue.forEach((r) => {
    const monthName = monthNames[r._id - 1];
    monthlyRevenueObj[monthName] = r.totalRevenue;
  });

  const tripPaymentAnalysis = {};
  tripRevenueBreakdown.forEach((item) => {
    tripPaymentAnalysis[item._id] = item.total;
  });

  return {
    totalRevenueAllTime: totalRevenueAllTime[0]?.total || 0,
    tripPaymentAnalysis,
    total_years: totalYears,
    monthlyRevenue: monthlyRevenueObj,
  };
};

const getTotalOverview = async () => {
  const [
    totalDriver,
    onlineDriver,
    totalUser,
    onlineUser,
    totalAdmin,
    totalAuth,
    totalCars,
  ] = await Promise.all([
    User.countDocuments({ role: EnumUserRole.DRIVER }),
    User.countDocuments({ role: EnumUserRole.DRIVER, isOnline: true }),
    User.countDocuments({ role: EnumUserRole.USER }),
    User.countDocuments({ role: EnumUserRole.USER, isOnline: true }),
    Admin.countDocuments(),
    Auth.countDocuments(),
    Car.countDocuments(),
  ]);

  return {
    totalDriver,
    onlineDriver,
    totalUser,
    onlineUser,
    totalAdmin,
    totalAuth,
    totalCars,
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
