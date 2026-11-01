import * as bidService from "../services/bid.service.js";
import { sendSuccess } from "../utils/response.js";

export const newBid = async (req, res) => {
  const bid = await bidService.placeBid(req.user, req.valid.params.id, req.valid.body);
  sendSuccess(res, { status: 201, message: "Bid placed successfully", data: bid });
};

export const getProductBids = async (req, res) => {
  const { items, meta } = await bidService.listProductBids(req.user, req.valid.params.id, req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const getMyBids = async (req, res) => {
  const { items, meta } = await bidService.listMyBids(req.user, req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const getReceivedBids = async (req, res) => {
  const { items, meta } = await bidService.listReceivedBids(req.user, req.valid.query);
  sendSuccess(res, { data: items, meta });
};
