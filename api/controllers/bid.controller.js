import Bids from "../models/bidModel.js";

// place new bid
export const newBid = async (req, res, next) => {
  try {
    const newBid = new Bids(req.body);
    await newBid.save();
    res.json({
      success: true,
      message: "Bid placed successfully",
      data: newBid,
    });
  } catch (error) {
    next(error);
  }
};

// get all bids

export const getAllBids = async (req, res, next) => {
  try {
    const { product, seller, buyer } = req.body;
    let filters = {};
    if (product) {
      filters.product = product;
    }
    if (seller) {
      filters.seller = seller;
    }
    if (buyer) {
      filters.buyer = buyer;
    }
    const bids = await Bids.find(filters)
      .populate("product")
      .populate("buyer")
      .populate("seller")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    next(error);
  }
};
