import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.route.js";
import mongoose from "mongoose";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use("/api/auth", authRoutes);

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

app.get("/", (req, res) => {
  res.send("Welcome to the Auth System API");
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
