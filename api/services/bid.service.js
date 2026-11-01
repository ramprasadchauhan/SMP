import Bids from "../models/bidModel.js";
import Product from "../models/productModel.js";
import { PRODUCT_STATUS, ROLES } from "../constants/index.js";
import { badRequest, notFound } from "../utils/AppError.js";
import { paginationMeta } from "../utils/query.js";
import { runInTransaction } from "../utils/transaction.js";
import { notifyUser } from "./notification.service.js";

const withMobile = (bid) => ({ ...bid, mobile: bid.mobile === undefined || bid.mobile === null ? "" : String(bid.mobile) });

export async function placeBid(buyer, productId, { bidAmount, message, mobile }) {
  const product = await Product.findById(productId).select("name seller status").lean();
  if (!product || product.status !== PRODUCT_STATUS.APPROVED) throw notFound("Product not found");
  if (String(product.seller) === String(buyer._id)) {
    throw badRequest("You cannot bid on your own product", { code: "OWN_PRODUCT" });
  }
  return runInTransaction(async (session) => {
    const [bid] = await Bids.create(
      [{ product: product._id, seller: product.seller, buyer: buyer._id, bidAmount, message, mobile }],
      { session }
    );
    await notifyUser(
      product.seller,
      {
        title: "New bid received",
        message: `${buyer.name} placed a bid of ${bidAmount} on "${product.name}".`,
        onClick: "/my-products",
      },
      session
    );
    return bid.toJSON();
  });
}

// Seller and admins see every bid with contact details. Other users see the
// bid list only if the seller opted in, and never the bidders' contact data.
export async function listProductBids(viewer, productId, { page, limit }) {
  const product = await Product.findById(productId).select("seller status showBidsOnProductPage").lean();
  if (!product) throw notFound("Product not found");
  const privileged = viewer.role === ROLES.ADMIN || String(product.seller) === String(viewer._id);
  if (!privileged && (product.status !== PRODUCT_STATUS.APPROVED || !product.showBidsOnProductPage)) {
    return { items: [], meta: { ...paginationMeta(page, limit, 0), visible: false } };
  }
  const filter = { product: product._id };
  const [items, total] = await Promise.all([
    Bids.find(filter)
      .select(privileged ? undefined : "bidAmount createdAt buyer")
      .populate("buyer", privileged ? "name email" : "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bids.countDocuments(filter),
  ]);
  return {
    items: privileged ? items.map(withMobile) : items,
    meta: { ...paginationMeta(page, limit, total), visible: true, privileged },
  };
}

async function pagedBids(filter, { page, limit }, populate) {
  const [items, total] = await Promise.all([
    Bids.find(filter)
      .populate(populate)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bids.countDocuments(filter),
  ]);
  return { items: items.map(withMobile), meta: paginationMeta(page, limit, total) };
}

export const listMyBids = (user, paging) =>
  pagedBids({ buyer: user._id }, paging, [
    { path: "product", select: "name price images status" },
    { path: "seller", select: "name" },
  ]);

export const listReceivedBids = (user, paging) =>
  pagedBids({ seller: user._id }, paging, [
    { path: "product", select: "name price images status" },
    { path: "buyer", select: "name email" },
  ]);
