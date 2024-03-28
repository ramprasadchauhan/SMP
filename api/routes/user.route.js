import express from "express";
import {
  getCurrentUser,
  getUsers,
  updateUserStatus,
} from "../controllers/user.controller.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

router.get("/get-current-user", verifyToken, getCurrentUser);

// get all users

router.get("/get-all-users", verifyToken, getUsers);
// update user status

router.put("/update-user-status/:id", updateUserStatus);

export default router;
