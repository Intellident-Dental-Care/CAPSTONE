import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { createDentistRequest, getDentistRequests } from "./requestsService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("dentist"), async (req, res) => {
  const dentistId = req.user.profileId || req.user.id;
  const result = await getDentistRequests(dentistId);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/", requireAuth, requireRole("dentist"), async (req, res) => {
  const dentistId = req.user.profileId || req.user.id;
  const result = await createDentistRequest(dentistId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

export default router;
