import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getDentistProfileDetails, updateDentistProfileDetails, updateDentistAvatarById } from "./profileService.js";
import { supabaseAdmin } from "../../shared/supabaseClient.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistProfileDetails(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/me", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await updateDentistProfileDetails(req.user.profileId || req.user.id, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.post("/avatar", requireAuth, requireRole("dentist"), async (req, res) => {
  const dentistId = req.user.profileId || req.user.id;
  const result = await updateDentistAvatarById(dentistId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.get("/image", requireAuth, requireRole("dentist"), async (req, res) => {
  try {
    const filePath = String(req.query.path || "").trim();

    if (!filePath) {
      return res.status(400).send("Missing image path");
    }

    const { data, error } = await supabaseAdmin.storage
      .from("profile-uploads")
      .download(filePath);

    if (error) throw error;

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader("Content-Type", data.type || "image/jpeg");
    res.send(buffer);
  } catch (error) {
    console.error("Error securely fetching dentist avatar:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;