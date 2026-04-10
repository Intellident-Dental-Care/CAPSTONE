import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getPatientsList } from "./patientsService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await getPatientsList();
  return res.status(result.statusCode || 500).json(result);
});

export default router;