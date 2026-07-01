import express from "express";
import { requireAuth, requireRole } from "../../shared/authMiddleware.js";
import { getAdminProfileById, updateAdminProfileById, updateAdminAvatarById } from "./profileService.js";
import { supabaseAdmin } from "../../shared/supabaseClient.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await getAdminProfileById(adminId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/me", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await updateAdminProfileById(adminId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.post("/avatar", requireAuth, requireRole("admin"), async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await updateAdminAvatarById(adminId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.get("/image", requireAuth, requireRole("admin"), async (req, res) => {
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
    console.error("Error securely fetching admin avatar:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;
