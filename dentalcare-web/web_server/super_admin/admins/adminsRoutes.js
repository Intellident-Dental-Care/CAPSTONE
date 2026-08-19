import express from "express";
import { requireAuth } from "../../shared/authMiddleware.js";
import { getAdminsList, createAdminAccount, updateAdminStatus } from "./adminsService.js";

const router = express.Router();

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin" || req.user?.role === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/", requireAuth, requireSuperAdmin, async (req, res) => {
  const result = await getAdminsList();
  return res.status(result.statusCode || 500).json(result);
});

router.post("/", requireAuth, requireSuperAdmin, async (req, res) => {
  const result = await createAdminAccount(req.body);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/status", requireAuth, requireSuperAdmin, async (req, res) => {
  const { id, is_active: isActive } = req.body || {};

  if (!id || typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "id and is_active (boolean) are required",
    });
  }

  const result = await updateAdminStatus(id, isActive);
  return res.status(result.statusCode || 500).json(result);
});

export default router;