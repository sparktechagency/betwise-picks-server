const { default: status } = require("http-status");
const ApiError = require("../../../error/ApiError");
const Auth = require("../auth/Auth");
const SuperAdmin = require("./SuperAdmin");
const unlinkFile = require("../../../util/unlinkFile");

const updateProfile = async (req) => {
  const { files, body: data } = req;
  const { userId, authId } = req.user;
  const updatedData = {
    ...(data.address && { address: data.address }),
    ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    ...(data.name && { name: data.name }),
  };
  const existingUser = await SuperAdmin.findById(userId).lean();

  if (files && files.profile_image) {
    updatedData.profile_image = files.profile_image[0].path;
    if (existingUser.profile_image) unlinkFile(existingUser.profile_image);
  }

  const [auth, admin] = await Promise.all([
    Auth.findByIdAndUpdate(
      authId,
      { name: updatedData.name },
      {
        new: true,
      }
    ),
    SuperAdmin.findByIdAndUpdate(
      userId,
      { ...updatedData },
      {
        new: true,
      }
    ).populate("authId"),
  ]);

  if (!auth || !admin) throw new ApiError(status.NOT_FOUND, "User not found!");

  return admin;
};

const getProfile = async (userData) => {
  const { userId, authId } = userData;

  const [auth, result] = await Promise.all([
    Auth.findById(authId),
    SuperAdmin.findById(userId).populate("authId"),
  ]);

  if (!result || !auth) throw new ApiError(status.NOT_FOUND, "Admin not found");
  if (auth.isBlocked)
    throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");

  return result;
};

const deleteMyAccount = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await Auth.isAuthExist(email);
  if (!isUserExist) throw new ApiError(status.NOT_FOUND, "User does not exist");
  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(status.FORBIDDEN, "Password is incorrect");
  }

  Promise.all([
    Auth.deleteOne({ email }),
    SuperAdmin.deleteOne({ authId: isUserExist._id }),
  ]);
};

const SuperAdminService = {
  updateProfile,
  getProfile,
  deleteMyAccount,
};

module.exports = { SuperAdminService };
