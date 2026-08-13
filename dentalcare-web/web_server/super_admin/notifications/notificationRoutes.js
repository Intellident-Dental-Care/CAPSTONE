import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js"; 
import { getUnreadNotifications, markAllNotificationsAsRead } from "./notificationService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("super_admin"), async (req, res) => {
  const adminId = req.user.id; 
  const result = await getUnreadNotifications(adminId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/mark-read", requireAuth, requireRole("super_admin"), async (req, res) => {
  const adminId = req.user.id;
  const result = await markAllNotificationsAsRead(adminId);
  return res.status(result.statusCode || 500).json(result);
});

export default router;