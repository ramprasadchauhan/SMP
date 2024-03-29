import Product from "../models/productModel.js";
import { errorHandler } from "../utils/error.js";
import multer from "multer";
import cloudinary from "../config/cloudinaryConfig.js";

export const addProduct = async (req, res, next) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const { seller, category = [], age = [], status } = req.body;
    let filters = {};
    if (seller) {
      filters.seller = seller;
    }
    if (status) {
      filters.status = status;
    }
    const products = await Product.find(filters)
      .populate("seller")
      .sort({ createdAt: -1 });
    if (!products) {
      return next(errorHandler(400, "Product not found"));
    }
    res.json({
      success: true,
      message: "products fetch successfully",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndUpdate(id, req.body);
    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id, req.body);
    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// handle image upload in cloudinary

export const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});
// update product status

export const updateProductStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    if (!id) {
      return next(errorHandler(400, "Product ID is missing"));
    }
    await Product.findByIdAndUpdate(id, { status });
    res.json({
      success: true,
      message: "Product status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("seller");
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
