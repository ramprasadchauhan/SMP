import express from "express";
import * as products from "../controllers/product.controller.js";
import * as bids from "../controllers/bid.controller.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../constants/index.js";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import {
  createProductSchema,
  manageExportSchema,
  manageSchema,
  marketplaceSchema,
  mineSchema,
  productIdSchema,
  removeImageSchema,
  updateProductSchema,
  updateStatusSchema,
} from "../validators/product.validator.js";
import { placeBidSchema, productBidsSchema } from "../validators/misc.validator.js";

const router = express.Router();
const admin = [requireAuth, requireRole(ROLES.ADMIN)];

router.get("/", validate(marketplaceSchema), h(products.getMarketplace));
router.get("/mine", requireAuth, validate(mineSchema), h(products.getMine));
router.get("/manage", admin, validate(manageSchema), h(products.getForModeration));
router.get("/manage/export", admin, validate(manageExportSchema), h(products.exportForModeration));

router.post("/", requireAuth, validate(createProductSchema), h(products.addProduct));
router.get("/:id", optionalAuth, validate(productIdSchema), h(products.getProduct));
router.patch("/:id", requireAuth, validate(updateProductSchema), h(products.editProduct));
router.delete("/:id", requireAuth, validate(productIdSchema), h(products.deleteProduct));
router.patch("/:id/status", admin, validate(updateStatusSchema), h(products.updateProductStatus));

router.post("/:id/images", requireAuth, validate(productIdSchema), imageUpload, h(products.uploadImage));
router.delete("/:id/images", requireAuth, validate(removeImageSchema), h(products.removeImage));

router.get("/:id/bids", requireAuth, validate(productBidsSchema), h(bids.getProductBids));
router.post("/:id/bids", requireAuth, validate(placeBidSchema), h(bids.newBid));

export default router;
