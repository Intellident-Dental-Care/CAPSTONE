import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { applyQueueDelay, getQueueForAdminBranch, updateBookingQueueStatus } from "./queueService.js";

const router = express.Router();

router.get("/today", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await getQueueForAdminBranch(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/status", requireAuth, requireRole("admin"), async (req, res) => {
  const { bookingId, status } = req.body || {};

  if (!bookingId || !status) {
    return res.status(400).json({ success: false, message: "bookingId and status are required" });
  }

  const result = await updateBookingQueueStatus(req.user.profileId || req.user.id, bookingId, status);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/delay", requireAuth, requireRole("admin"), async (req, res) => {
  // ADDED: Destructure 'reset' from the body
  const { delayMinutes, message, reset } = req.body || {};

  const result = await applyQueueDelay(req.user.profileId || req.user.id, {
    delayMinutes,
    message,
    reset, // Pass it to the service
  });

  return res.status(result.statusCode || 500).json(result);
});

export default router;