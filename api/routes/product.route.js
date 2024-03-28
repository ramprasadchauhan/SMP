import express from "express";
import { verifyToken } from "../utils/verifyToken.js";
import {
  addProduct,
  deleteProduct,
  editProduct,
  getProductById,
  getProducts,
  storage,
  updateProductStatus,
} from "../controllers/product.controller.js";
import multer from "multer";
import cloudinary from "../config/cloudinaryConfig.js";
import Product from "../models/productModel.js";

const router = express.Router();

router.post("/add-product", verifyToken, addProduct);
router.post("/get-products", getProducts);
router.put("/edit-product/:id", verifyToken, editProduct);
router.delete("/delete-product/:id", verifyToken, deleteProduct);
router.get("/get-product-by-id/:id", getProductById);
// update product status
router.put("/update-product-status/:id", updateProductStatus);

router.post(
  "/upload-product-image",
  verifyToken,
  multer({ storage: storage }).single("file"),
  async (req, res, next) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "sheymp",
      });
      const productId = req.body.productId;
      await Product.findByIdAndUpdate(productId, {
        $push: { images: result.secure_url },
      });
      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: result.secure_url,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
