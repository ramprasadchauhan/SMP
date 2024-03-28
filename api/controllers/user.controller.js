import User from "../models/userModel.js";

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);
    res.json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.json({
      success: true,
      message: "User status update successfully",
    });
  } catch (error) {
    next(error);
  }
};
