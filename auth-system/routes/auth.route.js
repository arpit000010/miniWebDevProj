import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";
import verifyToken from "../middleware/auth.middleware.js";

const router = express.Router();

// public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// protected route example
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.email}! This is your profile.` });
});

export default router;
