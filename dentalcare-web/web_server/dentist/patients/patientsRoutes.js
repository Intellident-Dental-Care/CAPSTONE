import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistPatientHistory } from "./patientsService.js";

const router = express.Router();

router.get("/history", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistPatientHistory(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

export default router;
