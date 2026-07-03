import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js"; 
import { getUnreadDentistNotifications, markDentistNotificationsAsRead } from "./notificationService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("dentist"), async (req, res) => {
  const dentistId = req.user.id; 
  const result = await getUnreadDentistNotifications(dentistId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/mark-read", requireAuth, requireRole("dentist"), async (req, res) => {
  const dentistId = req.user.id;
  const result = await markDentistNotificationsAsRead(dentistId);
  return res.status(result.statusCode || 500).json(result);
});

export default router;