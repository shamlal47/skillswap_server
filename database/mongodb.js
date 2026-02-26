import mongoose from "mongoose";
import { MONGO_URI } from "../config/env.js";


if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
    }

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

export default connectDB;