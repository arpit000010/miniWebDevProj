import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.route.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use(express.static(path.join(__dirname, "frontend")));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

await connectDB();

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
