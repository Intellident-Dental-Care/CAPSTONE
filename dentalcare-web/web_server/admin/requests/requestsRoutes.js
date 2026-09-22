import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { listLeaveRequests, reviewLeaveRequest } from "./requestsService.js";

const router = express.Router();

router.get("/leave", requireAuth, requireRole("admin"), async (_req, res) => {
  const result = await listLeaveRequests();
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/leave/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body || {};

    const adminData = JSON.parse(req.user.admin_data || "{}");
    const reviewerName = adminData?.fullName || req.user?.name || "Admin";

    const result = await reviewLeaveRequest(id, { status, rejectionReason, reviewerName });
    return res.status(result.statusCode || 500).json(result);
  } catch (error) {
    console.error("Error reviewing leave request:", error);
    return res.status(500).json({ success: false, message: "Failed to review leave request" });
  }
});

export default router;
