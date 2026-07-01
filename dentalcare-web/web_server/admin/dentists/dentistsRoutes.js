import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import {
  listDentistsWithSchedules,
  setDentistLeave,
  cancelDentistLeave,
  getDentistLeaves,
  checkDentistLeaveConflict,
} from "./dentistsService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const result = await listDentistsWithSchedules();
  return res.status(result.statusCode || 500).json(result);
});

router.post("/leave", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { dentistId, startDate, endDate, reason } = req.body || {};
    const adminData = JSON.parse(req.user.admin_data || "{}");
    const adminName = adminData?.fullName || req.user?.name || "Unknown";

    if (!dentistId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dentistId, startDate, endDate",
      });
    }

    const result = await setDentistLeave(dentistId, startDate, endDate, reason || "", adminName);
    return res.status(result.statusCode || 500).json(result);
  } catch (error) {
    console.error("Error setting dentist leave:", error);
    return res.status(500).json({ success: false, message: "Failed to set leave" });
  }
});

router.delete("/leave/:leaveId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { leaveId } = req.params;

    if (!leaveId) {
      return res.status(400).json({
        success: false,
        message: "Missing leaveId",
      });
    }

    const result = await cancelDentistLeave(leaveId);
    return res.status(result.statusCode || 500).json(result);
  } catch (error) {
    console.error("Error canceling leave:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel leave" });
  }
});

router.get("/leaves/:dentistId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { dentistId } = req.params;

    if (!dentistId) {
      return res.status(400).json({
        success: false,
        message: "Missing dentistId",
      });
    }

    const result = await getDentistLeaves(dentistId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch leaves" });
  }
});

router.post("/check-leave-conflict", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { dentistId, startDate, endDate } = req.body || {};

    if (!dentistId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dentistId, startDate, endDate",
      });
    }

    const result = await checkDentistLeaveConflict(dentistId, startDate, endDate);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error checking leave conflict:", error);
    return res.status(500).json({ success: false, message: "Failed to check leave conflict" });
  }
});

export default router;