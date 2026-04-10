import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistDashboardSnapshot } from "./dashboardService.js";

const router = express.Router();

router.get("/snapshot", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistDashboardSnapshot(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

export default router;
