const { default: status } = require("http-status");
const Admin = require("./Admin");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const { EnumUserRole } = require("../../../util/enum");
const Auth = require("../auth/Auth");
const EmailHelpers = require("../../../util/emailHelpers");

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
  const adminQuery = new QueryBuilder(Admin.find({}).lean(), query)
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
  // Add your logic here
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

const AdminService = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getProfileAdmin,
};

module.exports = AdminService;
