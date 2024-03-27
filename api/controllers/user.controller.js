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
