import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js"; 
import { getUnreadNotifications, markAllNotificationsAsRead } from "./notificationService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.id; 
  const branch = req.query.branch; 
  const result = await getUnreadNotifications(adminId, branch);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/mark-read", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.id;
  const branch = req.body.branch;
  const result = await markAllNotificationsAsRead(adminId, branch);
  return res.status(result.statusCode || 500).json(result);
});

export default router;