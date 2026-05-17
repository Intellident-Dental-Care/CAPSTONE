import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistDashboardSnapshot } from "./dashboardService.js";
import { supabaseAdmin } from "../../shared/supabaseClient.js"; // <-- Add this import

const router = express.Router();

router.get("/snapshot", requireAuth, requireRole("dentist"), async (req, res) => {
  try {
    const result = await getDentistDashboardSnapshot(req.user.profileId || req.user.id);
    return res.status(result.statusCode || 500).json(result);
  } catch (error) {
    console.error("Error in /snapshot route:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// NEW: Secure Image Proxy Route
// The (*) captures the full file path, even if it has slashes (e.g., folder/image.jpg)
router.get("/image/*", requireAuth, requireRole("dentist"), async (req, res) => {
  try {
    const filePath = req.params[0];
    
    // Download raw binary data directly from the private bucket
    const { data, error } = await supabaseAdmin.storage
      .from('patient-images')
      .download(filePath);

    if (error) throw error;

    // Convert the array buffer to a Node.js Buffer and stream it back
    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type);
    res.send(buffer);
  } catch (error) {
    console.error("Error securely fetching image:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;