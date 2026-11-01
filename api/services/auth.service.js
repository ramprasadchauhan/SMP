import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { USER_STATUS } from "../constants/index.js";
import { conflict, forbidden, unauthorized } from "../utils/AppError.js";
import { serializeUser } from "./user.service.js";

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown so response timing does not
// reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", BCRYPT_ROUNDS);

// Emails are normalised to lowercase by the validator and the schema, so this
// exact match uses the unique email index. (The migration script lowercases
// any legacy mixed-case emails.)
const byEmail = (email) => User.findOne({ email });

export async function register({ name, email, password }) {
  if (await byEmail(email).select("_id").lean()) {
    throw conflict("An account with this email already exists", { code: "EMAIL_TAKEN" });
  }
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    lastLoginAt: new Date(),
  });
  return { user: serializeUser(user.toObject()), tokenVersion: 0, _id: user._id };
}

export async function login({ email, password }) {
  const user = await byEmail(email).select("+password +tokenVersion");
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !valid) {
    throw unauthorized("Invalid email or password", { code: "INVALID_CREDENTIALS" });
  }
  // Only disclosed after the password has been verified.
  if (user.status !== USER_STATUS.ACTIVE) {
    throw forbidden("Your account has been blocked. Please contact an administrator.", {
      code: "ACCOUNT_BLOCKED",
    });
  }
  // updateOne (not save) so legacy documents are never re-validated on sign-in.
  user.lastLoginAt = new Date();
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: user.lastLoginAt } });
  return { user: serializeUser(user.toObject()), tokenVersion: user.tokenVersion ?? 0, _id: user._id };
}

export async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(userId, { $set: { name } }, { new: true, runValidators: true }).lean();
  return serializeUser(user);
}

// Bumps tokenVersion so every other session is signed out.
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password +tokenVersion");
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw unauthorized("Current password is incorrect", { code: "INVALID_CREDENTIALS" });
  }
  const tokenVersion = (user.tokenVersion ?? 0) + 1;
  await User.updateOne(
    { _id: user._id },
    { $set: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), tokenVersion } }
  );
  return { _id: user._id, tokenVersion };
}
