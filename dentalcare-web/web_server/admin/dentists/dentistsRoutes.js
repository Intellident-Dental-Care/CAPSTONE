import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { listDentistsWithSchedules } from "./dentistsService.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const result = await listDentistsWithSchedules();
  return res.status(result.statusCode || 500).json(result);
});

export default router;
