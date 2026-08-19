import express from "express";
import { requireAuth, requireSuperAdmin } from "../../shared/authMiddleware.js"; 
import { getUnreadNotifications, markAllNotificationsAsRead } from "./notificationService.js";

const router = express.Router();

router.get("/", requireAuth, requireSuperAdmin, async (req, res) => {
  const adminId = req.user.profileId || req.user.id; 
  const result = await getUnreadNotifications(adminId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/mark-read", requireAuth, requireSuperAdmin, async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await markAllNotificationsAsRead(adminId);
  return res.status(result.statusCode || 500).json(result);
});

export default router;