import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    // Stored as text so leading zeros and "+" country codes survive.
    // Older documents hold numbers; readers normalise with String().
    mobile: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

bidSchema.index({ product: 1, createdAt: -1 });
bidSchema.index({ buyer: 1, createdAt: -1 });
bidSchema.index({ seller: 1, createdAt: -1 });

const Bids = mongoose.model("Bids", bidSchema);
export default Bids;
