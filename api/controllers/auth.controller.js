import User from "../models/userModel.js";
import { errorHandler } from "../utils/error.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res, next) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  if (
    !name ||
    !password ||
    !email ||
    name === "" ||
    password === "" ||
    email === ""
  ) {
    next(errorHandler(400, "All fields are required"));
  }
  try {
    const user = await User.findOne({ email });
    if (user) {
      return next(errorHandler(400, "User already exists"));
    }
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res.json({ success: true, message: "User created successfully" });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === "" || password === "") {
    return next(errorHandler(400, "All fields are required"));
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(errorHandler(500, "User not exist"));
    }
    if (user.status !== "active") {
      return next(
        errorHandler(500, "User account is blocked. Please contect to admin")
      );
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return next(errorHandler(400, "Invalid password"));
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },

      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    console.log(process.env.JWT_SECRET);
    res.json({
      success: true,
      message: "User logged in successfully",
      data: token,
    });
  } catch (error) {
    next(error);
  }
};
