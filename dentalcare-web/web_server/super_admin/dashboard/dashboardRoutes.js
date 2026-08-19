import express from "express";
import { requireAuth } from "../../shared/authMiddleware.js";
import { getSuperAdminDashboard } from "./dashboardService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin" || req.user?.role === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/snapshot", requireAuth, requireSuperAdmin, async (req, res) => {
  const { start, end } = req.query;
  const result = await getSuperAdminDashboard(start, end);
  return res.status(result.statusCode || 500).json(result);
});

export default router;