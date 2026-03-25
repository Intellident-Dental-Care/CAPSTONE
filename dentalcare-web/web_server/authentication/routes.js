import express from "express";
import {
  authenticateAdmin,
  checkAdminPermission,
  getAdminProfile,
  upsertAdminProfileDetails,
  verifyAdminToken,
} from "./adminLogin.js";
import {
  authenticateDentist,
  getDentistProfile,
  upsertDentistProfileDetails,
  verifyDentistToken,
} from "./dentistLogin.js";
import { supabaseAdmin } from "../shared/supabaseClient.js";
import { requireAuth, requireRole, requireVerificationToken } from "../shared/authMiddleware.js";
import { generateOtp, sendOtpEmail } from "../nodemailer/emailOtpService.js";
import { signToken } from "./authUtils.js";

const router = express.Router();

const ROLE_TABLE_MAP = {
  admin: "admin_list",
  dentist: "dentist_list",
};

const inMemoryOtpStore = new Map();

const getOtpStoreKey = (role, profileId) => `${role}:${profileId}`;

const isMissingOtpColumnError = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  return msg.includes("verification_otp") || msg.includes("otp_expires_at") || msg.includes("column");
};

const getRoleProfileSelect = (role) => {
  return role === "admin" ? "id, email, full_name" : "id, email, name";
};

const resolveRoleAndProfile = async ({ role, profileId, email }) => {
  const normalizedRole = role === "admin" ? "admin" : role === "dentist" ? "dentist" : null;

  if (normalizedRole && profileId) {
    const tableName = ROLE_TABLE_MAP[normalizedRole];
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select(getRoleProfileSelect(normalizedRole))
      .eq("id", profileId)
      .single();

    if (!error && data) {
      return { role: normalizedRole, profile: data };
    }
  }

  if (email) {
    const cleanEmail = String(email).trim().toLowerCase();

    const { data: adminData } = await supabaseAdmin
      .from("admin_list")
      .select("id, email, full_name")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (adminData?.id) {
      return { role: "admin", profile: adminData };
    }

    const { data: dentistData } = await supabaseAdmin
      .from("dentist_list")
      .select("id, email, name")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (dentistData?.id) {
      return { role: "dentist", profile: dentistData };
    }
  }

  return null;
};

const writeOtp = async ({ role, profileId, otp }) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const tableName = ROLE_TABLE_MAP[role];

  const { error } = await supabaseAdmin
    .from(tableName)
    .update({
      verification_otp: otp,
      otp_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error && !isMissingOtpColumnError(error)) {
    throw error;
  }

  if (error && isMissingOtpColumnError(error)) {
    inMemoryOtpStore.set(getOtpStoreKey(role, profileId), {
      otp,
      expiresAt,
    });
    return;
  }

  inMemoryOtpStore.set(getOtpStoreKey(role, profileId), {
    otp,
    expiresAt,
  });
};

const verifyOtpAndActivate = async ({ role, profileId, otp }) => {
  const tableName = ROLE_TABLE_MAP[role];

  const verifySelect =
    role === "admin"
      ? "id, email, is_active, is_verified, full_name, admin_type, branch"
      : "id, email, is_active, is_verified, name";

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select(verifySelect)
    .eq("id", profileId)
    .single();

  if (error || !data) {
    return { success: false, statusCode: 404, message: "Profile not found" };
  }

  if (data.is_verified) {
    return { success: true, statusCode: 200, alreadyVerified: true, data };
  }

  let storedOtp = null;
  let storedExpiry = null;

  const { data: otpData, error: otpSelectError } = await supabaseAdmin
    .from(tableName)
    .select("verification_otp, otp_expires_at")
    .eq("id", profileId)
    .maybeSingle();

  if (!otpSelectError && otpData) {
    storedOtp = otpData.verification_otp;
    storedExpiry = otpData.otp_expires_at;
  }

  if (otpSelectError && !isMissingOtpColumnError(otpSelectError)) {
    return { success: false, statusCode: 500, message: "Failed to verify OTP" };
  }

  if (!storedOtp) {
    const mem = inMemoryOtpStore.get(getOtpStoreKey(role, profileId));
    storedOtp = mem?.otp || null;
    storedExpiry = mem?.expiresAt || null;
  }

  if (!storedOtp || storedOtp !== otp) {
    return { success: false, statusCode: 400, message: "Invalid OTP" };
  }

  if (!storedExpiry || new Date(storedExpiry) < new Date()) {
    return { success: false, statusCode: 400, message: "OTP has expired" };
  }

  const { error: updateError } = await supabaseAdmin
    .from(tableName)
    .update({
      is_verified: true,
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (updateError && !String(updateError?.message || "").toLowerCase().includes("last_login")) {
    return { success: false, statusCode: 500, message: "Failed to update verification status" };
  }

  if (updateError && String(updateError?.message || "").toLowerCase().includes("last_login")) {
    const { error: fallbackUpdateError } = await supabaseAdmin
      .from(tableName)
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (fallbackUpdateError) {
      return { success: false, statusCode: 500, message: "Failed to update verification status" };
    }
  }

  inMemoryOtpStore.delete(getOtpStoreKey(role, profileId));

  return { success: true, statusCode: 200, data };
};

const isValidEmail = (value) => {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sendOtpForRoleProfile = async ({ role, profileId, fullNameOverride, targetEmail }) => {
  const tableName = ROLE_TABLE_MAP[role];
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select(getRoleProfileSelect(role))
    .eq("id", profileId)
    .single();

  if (error || !data) {
    throw new Error("Profile not found");
  }

  const otp = generateOtp();
  const emailToUse = isValidEmail(targetEmail) ? String(targetEmail).trim().toLowerCase() : data.email;

  console.log("[OTP_DEBUG] Generated OTP", {
    role,
    profileId,
    email: emailToUse,
    otp,
  });
  await writeOtp({ role, profileId, otp });

  await sendOtpEmail({
    email: emailToUse,
    fullName: fullNameOverride || data.full_name || data.name || "User",
    otp,
    role,
  });

  console.log("[OTP_DEBUG] OTP email send attempted", {
    role,
    profileId,
    email: emailToUse,
  });
};

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateAdmin(email, password);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/dentist/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await authenticateDentist(email, password);
  return res.status(result.statusCode || 500).json(result);
});

router.post("/complete-profile", requireVerificationToken, async (req, res) => {
  const { fullName, phone, dob, gender, contactDetail, newPassword, confirmPassword } = req.body || {};

  if (!fullName || !phone) {
    return res.status(400).json({ success: false, message: "fullName and phone are required" });
  }

  if (req.user.role === "admin") {
    const result = await upsertAdminProfileDetails(req.user.profileId, {
      fullName,
      phone,
      dob,
      gender,
      contactDetail,
      newPassword,
      confirmPassword,
    }, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    try {
      await sendOtpForRoleProfile({
        role: "admin",
        profileId: req.user.profileId,
        fullNameOverride: fullName,
        targetEmail: contactDetail,
      });
      return res.status(200).json({ success: true, otpSent: true, message: "Profile saved and OTP sent" });
    } catch (error) {
      return res.status(200).json({
        success: true,
        otpSent: false,
        message: "Profile saved but OTP could not be sent. Please try resend OTP.",
      });
    }
  }

  if (req.user.role === "dentist") {
    const result = await upsertDentistProfileDetails(req.user.profileId, {
      fullName,
      phone,
      dob,
      gender,
      contactDetail,
      newPassword,
      confirmPassword,
    }, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    try {
      await sendOtpForRoleProfile({
        role: "dentist",
        profileId: req.user.profileId,
        fullNameOverride: fullName,
        targetEmail: contactDetail,
      });
      return res.status(200).json({ success: true, otpSent: true, message: "Profile saved and OTP sent" });
    } catch (error) {
      return res.status(200).json({
        success: true,
        otpSent: false,
        message: "Profile saved but OTP could not be sent. Please try resend OTP.",
      });
    }
  }

  return res.status(400).json({ success: false, message: "Unsupported role" });
});

const handleSendOtp = async (req, res) => {
  try {
    const { email, fullName } = req.body || {};
    await sendOtpForRoleProfile({
      role: req.user.role,
      profileId: req.user.profileId,
      targetEmail: email,
      fullNameOverride: fullName,
    });

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error?.message || "Unknown error",
    });
  }
};

router.post("/send-otp", requireVerificationToken, handleSendOtp);
router.post("/send-verification", requireVerificationToken, handleSendOtp);

// DentalCareApp-style public endpoint: sends OTP using payload data.
const handleSendVerificationPublic = async (req, res) => {
  try {
    const { role, profileId, email, fullName } = req.body || {};
    const resolved = await resolveRoleAndProfile({ role, profileId, email });

    if (!resolved?.profile?.id || !resolved?.role) {
      return res.status(400).json({ success: false, message: "Profile not found for OTP sending" });
    }

    const otp = generateOtp();
    await writeOtp({ role: resolved.role, profileId: resolved.profile.id, otp });

    await sendOtpEmail({
      email: email || resolved.profile.email,
      fullName: fullName || resolved.profile.full_name || resolved.profile.name || "User",
      otp,
      role: resolved.role,
    });

    return res.status(200).json({ success: true, message: "Verification code sent to your email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send verification code" });
  }
};

router.post("/send-verification-public", handleSendVerificationPublic);

router.post("/resend-otp", async (req, res) => {
  return handleSendVerificationPublic(req, res);
});

router.post("/verify-otp-public", async (req, res) => {
  const { role, profileId, email, otp } = req.body || {};

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  const resolved = await resolveRoleAndProfile({ role, profileId, email });
  if (!resolved?.profile?.id || !resolved?.role) {
    return res.status(400).json({ success: false, message: "Profile not found for OTP verification" });
  }

  const verifyResult = await verifyOtpAndActivate({
    role: resolved.role,
    profileId: resolved.profile.id,
    otp,
  });

  if (!verifyResult.success) {
    return res.status(verifyResult.statusCode).json({ success: false, message: verifyResult.message });
  }

  const profile = verifyResult.data;

  return res.status(200).json({
    success: true,
    message: verifyResult.alreadyVerified ? "Already verified" : "Verification successful",
    data: { profile, role: resolved.role },
  });
});

router.post("/verify-otp", requireVerificationToken, async (req, res) => {
  const { otp } = req.body || {};

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  const verifyResult = await verifyOtpAndActivate({
    role: req.user.role,
    profileId: req.user.profileId,
    otp,
  });

  if (!verifyResult.success) {
    return res.status(verifyResult.statusCode).json({ success: false, message: verifyResult.message });
  }

  const profile = verifyResult.data;

  const sessionToken = signToken({
    id: req.user.id,
    profileId: req.user.profileId,
    email: profile.email || req.user.email,
    name: profile.full_name || profile.name,
    role: req.user.role,
    adminType: profile.admin_type,
    branch: profile.branch,
    purpose: "session",
  });

  return res.status(200).json({
    success: true,
    message: verifyResult.alreadyVerified ? "Already verified" : "Verification successful",
    data: {
      token: sessionToken,
      role: req.user.role,
      profile,
    },
  });
});

router.get("/admin/profile", requireAuth, requireRole("admin"), async (req, res) => {
  const result = await getAdminProfile(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/dentist/profile", requireAuth, requireRole("dentist"), async (req, res) => {
  const result = await getDentistProfile(req.user.profileId || req.user.id);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/admin/verify", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const result = await verifyAdminToken(token);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/dentist/verify", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const result = await verifyDentistToken(token);
  return res.status(result.statusCode || 500).json(result);
});

router.get("/admin/check-permission/:permission", requireAuth, requireRole("admin"), async (req, res) => {
  const { permission } = req.params;
  const hasPermission = await checkAdminPermission(req.user.profileId || req.user.id, permission);
  return res.status(200).json({ success: true, permission, hasPermission });
});

router.post("/logout", (_req, res) => {
  return res.status(200).json({ success: true, message: "Logged out" });
});

export default router;
