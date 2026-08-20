import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDashboardSnapshot } from "./dashboardService.js";

const router = express.Router();

router.get("/snapshot", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await getDashboardSnapshot(req.user.profileId || req.user.id, req.query.branch);
  return res.status(result.statusCode || 500).json(result);
});

export default router;