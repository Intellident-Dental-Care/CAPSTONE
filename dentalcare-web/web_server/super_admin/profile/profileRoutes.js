import express from "express";
import { requireAuth, requireSuperAdmin } from "../../shared/authMiddleware.js";
import { getSuperAdminProfileById, updateSuperAdminProfileById, updateSuperAdminAvatarById } from "./profileService.js";
import { supabaseAdmin } from "../../shared/supabaseClient.js";

const router = express.Router();

router.get("/me", requireAuth, requireSuperAdmin, async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await getSuperAdminProfileById(adminId);
  return res.status(result.statusCode || 500).json(result);
});

router.patch("/me", requireAuth, requireSuperAdmin, async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await updateSuperAdminProfileById(adminId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.post("/avatar", requireAuth, requireSuperAdmin, async (req, res) => {
  const adminId = req.user.profileId || req.user.id;
  const result = await updateSuperAdminAvatarById(adminId, req.body || {});
  return res.status(result.statusCode || 500).json(result);
});

router.get("/image", requireAuth, requireSuperAdmin, async (req, res) => {
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
    res.status(500).send("Error fetching image");
  }
});

export default router;