import express from "express";
import { authenticateAdmin, checkAdminPermission, getAdminProfile, upsertAdminProfileDetails, verifyAdminToken } from "./adminLogin.js";
import { authenticateDentist, getDentistProfile, upsertDentistProfileDetails, verifyDentistToken } from "./dentistLogin.js";
import { supabaseAdmin } from "../shared/supabaseClient.js";
import { requireAuth, requireRole, requireVerificationToken } from "../shared/authMiddleware.js";
import { generateOtp, sendOtpEmail } from "../nodemailer/emailOtpService.js";
import { signToken, verifyToken } from "./authUtils.js";

const router = express.Router();
const ROLE_TABLE_MAP = { admin: "admin_list", dentist: "dentist_list" };
const inMemoryOtpStore = new Map();

const getOtpStoreKey = (role, profileId) => `${role}:${profileId}`;
const isMissingOtpColumnError = (error) => String(error?.message || "").toLowerCase().includes("column");

const writeOtp = async ({ role, profileId, otp }) => {
  const tableName = ROLE_TABLE_MAP[role];
  const { error } = await supabaseAdmin.from(tableName).update({ verification_otp: otp, updated_at: new Date().toISOString() }).eq("id", profileId);
  if (error && !isMissingOtpColumnError(error)) throw error;
  inMemoryOtpStore.set(getOtpStoreKey(role, profileId), { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
};

const verifyOtpAndActivate = async ({ role, profileId, otp }) => {
  const tableName = ROLE_TABLE_MAP[role];
  const { data, error } = await supabaseAdmin.from(tableName).select("*").eq("id", profileId).single();
  if (error || !data) return { success: false, statusCode: 404, message: "Profile not found" };
  if (data.is_verified) return { success: true, statusCode: 200, alreadyVerified: true, data };

  const storedOtp = data.verification_otp || inMemoryOtpStore.get(getOtpStoreKey(role, profileId))?.otp;
  if (!storedOtp || storedOtp !== otp) return { success: false, statusCode: 400, message: "Invalid OTP" };

  await supabaseAdmin.from(tableName).update({ is_verified: true, updated_at: new Date().toISOString() }).eq("id", profileId);
  inMemoryOtpStore.delete(getOtpStoreKey(role, profileId));
  return { success: true, statusCode: 200, data };
};

router.post("/admin/login", async (req, res) => {
  const result = await authenticateAdmin(req.body.email, req.body.password);
  res.status(result.statusCode || 500).json(result);
});

router.post("/dentist/login", async (req, res) => {
  const result = await authenticateDentist(req.body.email, req.body.password);
  res.status(result.statusCode || 500).json(result);
});

router.post("/complete-profile", requireVerificationToken, async (req, res) => {
  const { fullName, phone, dob, gender, contactDetail, newPassword, confirmPassword } = req.body || {};
  if (!fullName || !phone) return res.status(400).json({ success: false, message: "Name and phone required" });

  const upsertFn = req.user.role === "admin" ? upsertAdminProfileDetails : upsertDentistProfileDetails;
  const result = await upsertFn(req.user.profileId, { fullName, phone, dob, gender, contactDetail, newPassword, confirmPassword }, req.user.id);
  if (!result.success) return res.status(400).json(result);
  
  return res.status(200).json({ success: true, message: "Profile saved. Now verify with invitation OTP." });
});

router.post("/verify-otp", requireVerificationToken, async (req, res) => {
  const result = await verifyOtpAndActivate({ role: req.user.role, profileId: req.user.profileId, otp: req.body.otp });
  if (!result.success) return res.status(result.statusCode).json(result);

  const profile = result.data;
  const sessionToken = signToken({ id: req.user.id, profileId: req.user.profileId, email: profile.email, name: profile.full_name || profile.name, role: req.user.role, adminType: profile.admin_type, branch: profile.branch, purpose: "session" });
  res.status(200).json({ success: true, data: { token: sessionToken, profile, role: req.user.role } });
});

router.post("/forgot-password/send-otp", async (req, res) => {
  const cleanEmail = String(req.body.email).trim().toLowerCase();
  const { data: admin } = await supabaseAdmin.from("admin_list").select("id, full_name").eq("email", cleanEmail).maybeSingle();
  const { data: dentist } = await supabaseAdmin.from("dentist_list").select("id, name").eq("email", cleanEmail).maybeSingle();
  const user = admin || dentist;
  if (!user) return res.status(404).json({ success: false, message: "Account not found" });

  const otp = generateOtp();
  const role = admin ? "admin" : "dentist";
  inMemoryOtpStore.set(`${role}:${user.id}:forgot_password`, { otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
  await sendOtpEmail({ email: cleanEmail, fullName: user.full_name || user.name, otp, role });
  res.status(200).json({ success: true, message: "OTP sent", data: { role, profileId: user.id, email: cleanEmail } });
});

router.post("/forgot-password/verify-otp", async (req, res) => {
  const { email, otp, role, profileId } = req.body;
  const record = inMemoryOtpStore.get(`${role}:${profileId}:forgot_password`);
  if (!record || record.otp !== otp || new Date(record.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  
  const resetToken = signToken({ role, profileId, email, purpose: "forgot_password_reset" });
  res.status(200).json({ success: true, data: { resetToken } });
});

router.post("/logout", (req, res) => res.status(200).json({ success: true }));
export default router;