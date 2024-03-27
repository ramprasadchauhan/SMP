import mongoose from "mongoose";

const connectDB = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log("MongoDb is connected");
    })
    .catch((err) => {
      console.log("Mongo connection error", err);
    });
};

export default connectDB;
