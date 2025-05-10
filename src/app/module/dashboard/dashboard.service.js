const { default: status } = require("http-status");

// overview ===============================================================================================================================

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

const totalOverview = async () => {
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

const growth = async (query) => {
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

// admin management =======================================================================================================================
const postAdmin = async (req) => {
  const { body: payload, files, user } = req;

  validateFields(files, [
    "profile_image",
    "id_or_passport_image",
    "psv_license_image",
    "driving_license_image",
  ]);
  validateFields(payload, [
    "name",
    "email",
    "password",
    "phoneNumber",
    "address",
    "idOrPassportNo",
    "drivingLicenseNo",
    "licenseType",
    "licenseExpiry",
  ]);

  const authData = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: EnumUserRole.DRIVER,
    isActive: true,
  };

  const auth = await Auth.create(authData);

  const driverData = {
    authId: auth._id,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: EnumUserRole.DRIVER,
    phoneNumber: payload.phoneNumber,
    address: payload.address,
    isAvailable: true,
    idOrPassportNo: payload.idOrPassportNo,
    drivingLicenseNo: payload.drivingLicenseNo,
    licenseType: payload.licenseType,
    licenseExpiry: payload.licenseExpiry,
    profile_image: files.profile_image[0].path,
    id_or_passport_image: files.id_or_passport_image[0].path,
    psv_license_image: files.psv_license_image[0].path,
    driving_license_image: files.driving_license_image[0].path,
    userAccountStatus: UserAccountStatus.VERIFIED,
  };

  const driver = await User.create(driverData);

  EmailHelpers.sendAddDriverTemp(payload.email, {
    password: payload.password,
    ...driver.toObject(),
  });

  return driver;
};

const getAdmin = async (query) => {
  validateFields(query, ["driverId"]);

  const driver = await User.findById(query.driverId)
    .populate("authId assignedCar")
    .lean();
  if (!driver) throw new ApiError(status.NOT_FOUND, "Driver not found");

  return driver;
};

const getAllAdmins = async (query) => {
  validateFields(query, ["role"]);

  if (!Object.values(EnumUserRole).includes(query.role))
    throw new ApiError(status.BAD_REQUEST, "Invalid role");

  const driversQuery = new QueryBuilder(
    User.find({ role: query.role })
      .populate([
        {
          path: "authId",
        },
      ])
      .sort({ email: 1 })
      .lean(),
    query
  )
    .search(["name", "email", "phoneNumber"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    driversQuery.modelQuery,
    driversQuery.countTotal(),
  ]);

  return {
    meta,
    result,
  };
};

const editAdmin = async (req) => {
  validateFields(req.body, ["authId", "userId"]);

  const { body, files = {} } = req;
  const { email, password, name, userId, authId, ...otherFields } = body || {};

  if (email || password)
    throw new ApiError(status.BAD_REQUEST, "Email & Password can't be changed");

  const driver = await User.findOne({
    _id: body.userId,
    authId: body.authId,
  });

  if (!driver) throw new ApiError(status.BAD_REQUEST, "Driver not found.");

  const updateData = { name, ...otherFields };

  const fileFields = [
    { key: "profile_image", oldPath: driver.profile_image },
    { key: "id_or_passport_image", oldPath: driver.id_or_passport_image },
    { key: "psv_license_image", oldPath: driver.psv_license_image },
    { key: "driving_license_image", oldPath: driver.driving_license_image },
  ];

  for (const { key, oldPath } of fileFields) {
    if (files[key]) {
      updateData[key] = files[key][0].path;
      unlinkFile(oldPath);
    }
  }

  const [updatedDriver] = await Promise.all([
    User.findByIdAndUpdate(userId, updateData, { new: true }).lean(),

    Auth.findByIdAndUpdate(authId, { name }, { new: true }).lean(),
  ]);

  return updatedDriver;
};

const blockUnblockAdmin = async (payload) => {
  validateFields(payload, ["authId"]);

  const { authId, isBlocked } = payload;

  const admin = await Auth.findByIdAndUpdate(
    authId,
    { $set: { isBlocked } },
    {
      new: true,
      runValidators: true,
    }
  ).select("isBlocked email");

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found");

  return admin;
};

const DashboardService = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  editAdmin,
  blockUnblockAdmin,
};

module.exports = DashboardService;
