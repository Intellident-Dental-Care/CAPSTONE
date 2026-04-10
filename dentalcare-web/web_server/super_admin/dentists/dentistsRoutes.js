import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistsList, createDentistAccount, updateDentistStatus, updateDentistSchedules } from "./dentistsService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await getDentistsList();
  return res.status(result.statusCode || 500).json(result);
});

router.post("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const result = await createDentistAccount(req.body);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/status", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const { id, is_active: isActive } = req.body || {};

  if (!id || typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "id and is_active (boolean) are required",
    });
  }

  const result = await updateDentistStatus(id, isActive);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/schedules", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const { id, schedules } = req.body || {};

  if (!id || !Array.isArray(schedules)) {
    return res.status(400).json({
      success: false,
      message: "id and schedules (array) are required",
    });
  }

  const result = await updateDentistSchedules(id, schedules);
  return res.status(result.statusCode || 500).json(result);
});

export default router;