import mongoose from "mongoose";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_MAX_IMAGES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_VALUES,
} from "../constants/index.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: PRODUCT_CATEGORIES,
    },
    // Age of the item in years.
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
      validate: [(v) => v.length <= PRODUCT_MAX_IMAGES, `At most ${PRODUCT_MAX_IMAGES} images`],
    },
    billAvailable: {
      type: Boolean,
      default: false,
    },
    warrantyAvailable: {
      type: Boolean,
      default: false,
    },
    accessoriesAvailable: {
      type: Boolean,
      default: false,
    },
    showBidsOnProductPage: {
      type: Boolean,
      default: false,
    },
    boxAvailable: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: PRODUCT_STATUS_VALUES,
      default: PRODUCT_STATUS.PENDING,
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
