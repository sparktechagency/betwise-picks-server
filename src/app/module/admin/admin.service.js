const { default: status } = require("http-status");
const Admin = require("./Admin");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const { EnumUserRole } = require("../../../util/enum");
const Auth = require("../auth/Auth");
const EmailHelpers = require("../../../util/emailHelpers");
const unlinkFile = require("../../../util/unlinkFile");

const postAdmin = async (req) => {
  const { body: payload, files } = req;

  validateFields(files, ["profile_image"]);
  validateFields(payload, [
    "name",
    "email",
    "password",
    "confirmPassword",
    "phoneNumber",
  ]);

  if (payload.password !== payload.confirmPassword)
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match");

  const authData = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: EnumUserRole.ADMIN,
    isActive: true,
  };

  const auth = await Auth.create(authData);

  const adminData = {
    authId: auth._id,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: EnumUserRole.ADMIN,
    phoneNumber: payload.phoneNumber,
    profile_image: files.profile_image[0].path,
  };

  const admin = await Admin.create(adminData);

  EmailHelpers.sendAddAdminEmailTemp(payload.email, {
    password: payload.password,
    ...admin.toObject(),
  });

  return admin;
};

const getAdmin = async (userData, query) => {
  validateFields(query, ["adminId"]);

  const admin = await Admin.findOne({
    _id: query.adminId,
  }).lean();

  if (!admin) throw new ApiError(status.NOT_FOUND, "Admin not found");

  return admin;
};

const getAllAdmins = async (userData, query) => {
  const adminQuery = new QueryBuilder(
    Admin.find({}).populate("authId").lean(),
    query
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [admins, meta] = await Promise.all([
    adminQuery.modelQuery,
    adminQuery.countTotal(),
  ]);

  return {
    meta,
    admins,
  };
};

const updateAdmin = async (userData, payload) => {
  validateFields(payload, ["adminId"]);

  const admin = await Admin.findById(payload.adminId).lean();
  if (!admin) throw new ApiError(status.NOT_FOUND, "Admin not found");

  const updatedAData = {
    ...(payload.name && { name: payload.name }),
    ...(payload.phoneNumber && { phoneNumber: payload.phoneNumber }),
  };

  const [updatedAdmin] = await Promise.all([
    Admin.findByIdAndUpdate(payload.adminId, updatedAData, {
      new: true,
      runValidators: true,
    }).populate("authId"),

    Auth.findByIdAndUpdate(
      admin.authId,
      {
        ...(payload.name && { name: payload.name }),
      },
      {
        new: true,
        runValidators: true,
      }
    ),
  ]);

  return updatedAdmin;
};

const updateAdminPassword = async (userData, payload) => {
  validateFields(payload, ["adminId", "password", "confirmPassword"]);

  if (payload.password !== payload.confirmPassword)
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match");

  const admin = await Admin.findById(payload.adminId).lean();
  const auth = await Auth.findById(admin.authId);

  if (!admin) throw new ApiError(status.NOT_FOUND, "Admin not found");

  auth.password = payload.password;
  await auth.save();

  return;
};

const deleteAdmin = async (userData, payload) => {
  validateFields(payload, ["adminId"]);

  const admin = await Admin.deleteOne({
    _id: payload.adminId,
  });

  if (!admin.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Admin not found");

  return admin;
};

const getProfileAdmin = async (userData) => {
  const { userId, authId } = userData;

  const [auth, result] = await Promise.all([
    Auth.findById(authId),
    Admin.findById(userId).populate("authId"),
  ]);

  if (!result || !auth) throw new ApiError(status.NOT_FOUND, "Admin not found");
  if (auth.isBlocked)
    throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");

  return result;
};

const updateProfileImageAdmin = async (req) => {
  const { user: userData, files } = req;
  validateFields(files, ["profile_image"]);

  const { userId, authId } = userData;

  const [auth, result] = await Promise.all([
    Auth.findById(authId),
    Admin.findById(userId).populate("authId"),
  ]);

  if (!result || !auth) throw new ApiError(status.NOT_FOUND, "Admin not found");

  if (result.profile_image) unlinkFile(result.profile_image);

  const updatedAdmin = await Admin.findByIdAndUpdate(
    userId,
    {
      profile_image: files.profile_image[0].path,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedAdmin;
};

const AdminService = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getProfileAdmin,
  updateAdminPassword,
  updateProfileImageAdmin,
};

module.exports = AdminService;
