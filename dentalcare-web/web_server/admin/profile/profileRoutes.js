import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getAdminProfileById, updateAdminProfileById } from "./profileService.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await getAdminProfileById(adminId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/me", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await updateAdminProfileById(adminId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

export default router;
