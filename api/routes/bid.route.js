import express from "express";
import * as bids from "../controllers/bid.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { listBidsSchema } from "../validators/misc.validator.js";

const router = express.Router();

router.use(requireAuth);

// Bids are placed and listed per product under /products/:id/bids.
router.get("/mine", validate(listBidsSchema), h(bids.getMyBids));
router.get("/received", validate(listBidsSchema), h(bids.getReceivedBids));

export default router;
