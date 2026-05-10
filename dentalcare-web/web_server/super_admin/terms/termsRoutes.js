import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getTermsDetails, saveTermsDetails } from "./termsService.js";

const router = express.Router();


const requireSuperAdmin = (req, res, next) => {
  if (req.user?.adminType === "super_admin" || req.user?.admin_type === "super_admin") return next();
  return res.status(403).json({ success: false, message: "Forbidden: Super Admin only" });
};

router.get("/", async (req, res) => {
  const result = await getTermsDetails();
  return res.status(result.statusCode || 500).json(result);
});

router.put("/", requireAuth, requireRole("admin"), requireSuperAdmin, async (req, res) => {
  const userId = req.user.profileId || req.user.id;
  const result = await saveTermsDetails(req.body.terms || [], userId);
  return res.status(result.statusCode || 500).json(result);
});

export default router;