import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { createDentistProcedure, getDentistPatientHistory } from "./patientsService.js";
import { supabaseAdmin } from "../../shared/supabaseClient.js"; 

const router = express.Router();

router.get("/history", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistPatientHistory(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/procedures", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await createDentistProcedure(req.user.profileId || req.user.id, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

// NEW: Secure Proxy Route specifically for dentist-images bucket
router.get("/image/dentist/*", requireAuth, requireRole("dentist"), async (req, res) => {
  try {
    const filePath = req.params[0];
    
    const { data, error } = await supabaseAdmin.storage
      .from('dentist-images')
      .download(filePath);

    if (error) throw error;

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type);
    res.send(buffer);
  } catch (error) {
    console.error("Error securely fetching dentist procedure image:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;