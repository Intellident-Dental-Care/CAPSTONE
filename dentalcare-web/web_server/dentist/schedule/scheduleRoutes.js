import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistSchedule } from "./scheduleService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistSchedule(req.user.profileId || req.user.id, {
    date: req.query.date,
    branch: req.query.branch,
  });
  return res.status(result.statusCode || 500).json(result);
});

export default router;
