import express from "express";
import { newBid, getAllBids } from "../controllers/bid.controller.js";
import { verifyToken } from "../utils/verifyToken.js";

const router = express();

router.post("/place-new-bid", verifyToken, newBid);
router.post("/get-all-bids", verifyToken, getAllBids);

export default router;
