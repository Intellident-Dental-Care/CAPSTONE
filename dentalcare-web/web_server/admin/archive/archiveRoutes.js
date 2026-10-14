import express from "express";
import { requireAuth, requireAnyRole } from "../../shared/authMiddleware.js";
import {
  listArchivedPatients,
  getArchivedPatientDetail,
  listArchivedBookings,
  getArchivedBookingDetail,
  listArchivedProcedures,
  getArchivedProcedureDetail,
  runArchiveSweep,
} from "./archiveService.js";

const router = express.Router();
const allowArchiveAccess = requireAnyRole("admin", "super_admin");

// Lets an admin force a sweep on demand (e.g. right after setup, or to verify
// the policy) in addition to the nightly automatic run.
router.post("/run", requireAuth, allowArchiveAccess, async (_req, res) => {
  const result = await runArchiveSweep();
  return res.status(result.statusCode || 500).json(result);
});

router.get("/bookings/:id", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await getArchivedBookingDetail(req.params.id);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/bookings", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await listArchivedBookings(req.query.search || "");
  return res.status(result.statusCode || 500).json(result);
});

router.get("/procedures/:id", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await getArchivedProcedureDetail(req.params.id);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/procedures", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await listArchivedProcedures(req.query.search || "");
  return res.status(result.statusCode || 500).json(result);
});

router.get("/:id", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await getArchivedPatientDetail(req.params.id);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/", requireAuth, allowArchiveAccess, async (req, res) => {
  const result = await listArchivedPatients(req.query.search || "");
  return res.status(result.statusCode || 500).json(result);
});

export default router;
