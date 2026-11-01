import { Readable } from "node:stream";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import env from "../config/env.js";
import cloudinary from "../config/cloudinaryConfig.js";
import {
  AUDIT_ACTIONS,
  EXPORT_ROW_LIMIT,
  PRODUCT_AGE_RANGES,
  PRODUCT_MAX_IMAGES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_TRANSITIONS,
  ROLES,
} from "../constants/index.js";
import { AppError, badRequest, conflict, forbidden, notFound } from "../utils/AppError.js";
import { escapeRegex, paginationMeta, toSort } from "../utils/query.js";
import { runInTransaction } from "../utils/transaction.js";
import { recordAudit } from "./audit.service.js";
import { notifyAdmins, notifyUser } from "./notification.service.js";

const SELLER_PUBLIC = "name";
const SELLER_CONTACT = "name email";

const isAdmin = (user) => user?.role === ROLES.ADMIN;
const isOwner = (user, product) => user && String(product.seller?._id ?? product.seller) === String(user._id);

function nameSearch(q) {
  return q ? { name: new RegExp(escapeRegex(q), "i") } : {};
}

async function paged(filter, { sort, page, limit, populate }) {
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("seller", populate)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(page, limit, total) };
}

const MARKET_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
};

// Public marketplace: only approved products are ever returned.
export function listMarketplace({ q, category, age, minPrice, maxPrice, sort, page, limit }) {
  const filter = { status: PRODUCT_STATUS.APPROVED, ...nameSearch(q) };
  if (category.length) filter.category = { $in: category };
  if (age.length) {
    filter.$or = age.map((key) => {
      const [from, to] = PRODUCT_AGE_RANGES[key];
      return { age: { $gte: from, $lte: to } };
    });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  return paged(filter, { sort: MARKET_SORTS[sort], page, limit, populate: SELLER_PUBLIC });
}

export function listOwnProducts(user, { q, status, sort, order, page, limit }) {
  const filter = { seller: user._id, ...nameSearch(q) };
  if (status) filter.status = status;
  return paged(filter, { sort: toSort(sort, order), page, limit, populate: SELLER_PUBLIC });
}

function manageFilter({ q, status, category, seller }) {
  const filter = { ...nameSearch(q) };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (seller) filter.seller = seller;
  return filter;
}

export async function listForModeration({ page, limit, sort, order, ...filters }) {
  const filter = manageFilter(filters);
  const [result, counts] = await Promise.all([
    paged(filter, { sort: toSort(sort, order), page, limit, populate: SELLER_CONTACT }),
    Product.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  result.meta.statusCounts = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return result;
}

export function exportForModeration({ sort, order, ...filters }) {
  return Product.find(manageFilter(filters))
    .populate("seller", SELLER_CONTACT)
    .sort(toSort(sort, order))
    .limit(EXPORT_ROW_LIMIT)
    .lean();
}

// Non-approved products are visible only to their seller and to admins; for
// everyone else they do not exist (404, not 403, to avoid leaking ids).
export async function getProduct(id, viewer) {
  const product = await Product.findById(id)
    .populate("seller", viewer ? SELLER_CONTACT : SELLER_PUBLIC)
    .lean();
  if (!product) throw notFound("Product not found");
  if (product.status !== PRODUCT_STATUS.APPROVED && !isOwner(viewer, product) && !isAdmin(viewer)) {
    throw notFound("Product not found");
  }
  return product;
}

async function loadForWrite(id, user) {
  const product = await Product.findById(id);
  if (!product) throw notFound("Product not found");
  if (!isOwner(user, product) && !isAdmin(user)) throw forbidden("You can only manage your own products");
  return product;
}

export async function createProduct(user, data) {
  const product = await Product.create({ ...data, seller: user._id, status: PRODUCT_STATUS.PENDING });
  await notifyAdmins(
    {
      title: "New product awaiting review",
      message: `${user.name} submitted "${product.name}" for review.`,
      onClick: "/admin/products?status=pending",
    },
    { exclude: user._id }
  );
  return product.toJSON();
}

export async function updateProduct(user, id, data) {
  const product = await loadForWrite(id, user);
  product.set(data);
  await product.save();
  return product.toJSON();
}

export async function deleteProduct(user, id, requestId) {
  const product = await loadForWrite(id, user);
  await runInTransaction(async (session) => {
    await Bids.deleteMany({ product: product._id }, { session });
    await Product.deleteOne({ _id: product._id }, { session });
    if (!isOwner(user, product)) {
      await recordAudit(
        {
          actor: user,
          action: AUDIT_ACTIONS.PRODUCT_DELETED,
          targetType: "product",
          targetId: product._id,
          targetLabel: product.name,
          requestId,
        },
        session
      );
    }
  });
}

export async function updateProductStatus(actor, id, status, requestId) {
  return runInTransaction(async (session) => {
    const product = await Product.findById(id).session(session);
    if (!product) throw notFound("Product not found");
    const allowed = PRODUCT_STATUS_TRANSITIONS[product.status] || [];
    if (!allowed.includes(status)) {
      throw conflict(`A ${product.status} product cannot be changed to ${status}`, { code: "INVALID_TRANSITION" });
    }
    const previous = product.status;
    const updated = await Product.findByIdAndUpdate(id, { $set: { status } }, { new: true, session })
      .populate("seller", SELLER_CONTACT)
      .lean();

    await recordAudit(
      {
        actor,
        action: AUDIT_ACTIONS.PRODUCT_STATUS_CHANGED,
        targetType: "product",
        targetId: product._id,
        targetLabel: product.name,
        changes: { status: { from: previous, to: status } },
        requestId,
      },
      session
    );
    await notifyUser(
      product.seller,
      {
        title: "Product status updated",
        message: `Your product "${product.name}" has been ${status}.`,
        onClick: "/my-products",
      },
      session
    );
    return updated;
  });
}

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "sheymp", resource_type: "image" }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function addProductImage(user, id, file) {
  const product = await loadForWrite(id, user);
  if (!env.cloudinaryConfigured) {
    throw new AppError(503, "Image uploads are not configured on this server", { code: "UPLOADS_DISABLED" });
  }
  if (product.images.length >= PRODUCT_MAX_IMAGES) {
    throw badRequest(`A product can have at most ${PRODUCT_MAX_IMAGES} images`);
  }
  let result;
  try {
    result = await uploadBuffer(file.buffer);
  } catch {
    throw new AppError(502, "The image could not be uploaded. Please try again.", { code: "UPLOAD_FAILED" });
  }
  // Atomic push guarded by the size check, so concurrent uploads cannot exceed the cap.
  const updated = await Product.findOneAndUpdate(
    { _id: product._id, [`images.${PRODUCT_MAX_IMAGES - 1}`]: { $exists: false } },
    { $push: { images: result.secure_url } },
    { new: true }
  ).lean();
  if (!updated) throw badRequest(`A product can have at most ${PRODUCT_MAX_IMAGES} images`);
  return updated;
}

export async function removeProductImage(user, id, url) {
  const product = await loadForWrite(id, user);
  if (!product.images.includes(url)) throw notFound("Image not found on this product");
  return Product.findByIdAndUpdate(product._id, { $pull: { images: url } }, { new: true }).lean();
}
