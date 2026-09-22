import express from "express";
import { requireAuth, requireSuperAdmin } from "../../shared/authMiddleware.js";
import { listScheduleRequests, reviewScheduleRequest } from "./requestsService.js";

const router = express.Router();

router.get("/schedule", requireAuth, requireSuperAdmin, async (_req, res) => {
  const result = await listScheduleRequests();
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/schedule/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body || {};

    const adminData = JSON.parse(req.user.admin_data || "{}");
    const reviewerName = adminData?.fullName || req.user?.name || "Super Admin";

    const result = await reviewScheduleRequest(id, { status, rejectionReason, reviewerName });
    return res.status(result.statusCode || 500).json(result);
  } catch (error) {
    console.error("Error reviewing schedule request:", error);
    return res.status(500).json({ success: false, message: "Failed to review schedule request" });
  }
});

export default router;
