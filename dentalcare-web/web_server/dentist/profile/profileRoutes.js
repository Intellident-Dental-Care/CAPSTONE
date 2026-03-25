import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistProfileDetails, updateDentistProfileDetails } from "./profileService.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistProfileDetails(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/me", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await updateDentistProfileDetails(req.user.profileId || req.user.id, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

export default router;
