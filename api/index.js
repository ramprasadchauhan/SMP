import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/dbConfig.js";

import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";
import bidRoute from "./routes/bidRoute.js";

const app = express();

dotenv.config();

app.use(express.json());

const port = process.env.PORT || 8500;

app.listen(port, () => {
  connectDB();
  console.log(`app is running on port ${port}`);
});

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/product", productRoute);
app.use("/api/bid", bidRoute);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
