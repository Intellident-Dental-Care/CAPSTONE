import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getSuperAdminDashboard } from "./dashboardService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/snapshot", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  // Extract start and end from the query parameters
  const { start, end } = req.query;
  
  // Pass them to the service
  const result = await getSuperAdminDashboard(start, end);
  return res.status(result.statusCode || 500).json(result);
});

export default router;