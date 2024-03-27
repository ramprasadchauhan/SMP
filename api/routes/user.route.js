import express from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express.Router();

router.get("/get-current-user", verifyToken, getCurrentUser);

export default router;
