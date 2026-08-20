import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { createWalkInAppointment, listAppointments, updateAppointmentStatus } from "./appointmentsService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await listAppointments(adminId, req.query.branch);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await updateAppointmentStatus(req.params.id, req.body?.status);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/walk-in", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await createWalkInAppointment(req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

export default router;