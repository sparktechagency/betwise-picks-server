const { default: status } = require("http-status");
const Admin = require("./Admin");
const QueryBuilder = require("../../../builder/queryBuilder");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");

const postAdmin = async (userData, payload) => {
  // Add your logic here
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

const AdminService = {
  postAdmin,
  getAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
};

module.exports = AdminService;
