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
import {
  requireAuth,
  requireRole,
  requireVerificationToken,
} from "../shared/authMiddleware.js";
import { generateOtp, sendOtpEmail } from "../nodemailer/emailOtpService.js";
import { signToken, verifyToken } from "./authUtils.js";
import crypto from "crypto";

import {
  bruteForceProtection,
  sanitizeLoginInputs,
} from "../security/loginSecurity.js";

const router = express.Router();

const ROLE_TABLE_MAP = {
  admin: "admin_list",
  dentist: "dentist_list",
};

const inMemoryOtpStore = new Map();

const getOtpStoreKey = (role, profileId) => `${role}:${profileId}`;

const isMissingOtpColumnError = (error) =>
  String(error?.message || "").toLowerCase().includes("column");

const writeOtp = async ({ role, profileId, otp }) => {
  const tableName = ROLE_TABLE_MAP[role];

  const { error } = await supabaseAdmin
    .from(tableName)
    .update({
      verification_otp: otp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error && !isMissingOtpColumnError(error)) throw error;

  inMemoryOtpStore.set(getOtpStoreKey(role, profileId), {
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
};

const verifyOtpAndActivate = async ({ role, profileId, otp }) => {
  const tableName = ROLE_TABLE_MAP[role];

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !data) {
    return {
      success: false,
      statusCode: 400,
      message: "Profile not found",
    };
  }

  if (data.is_verified) {
    return {
      success: true,
      statusCode: 200,
      alreadyVerified: true,
      data,
    };
  }

  const storedOtp =
    data.verification_otp ||
    inMemoryOtpStore.get(getOtpStoreKey(role, profileId))?.otp;

  if (!storedOtp || storedOtp !== otp) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid OTP",
    };
  }

  await supabaseAdmin
    .from(tableName)
    .update({
      is_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  inMemoryOtpStore.delete(getOtpStoreKey(role, profileId));

  return {
    success: true,
    statusCode: 200,
    data,
  };
};

router.post(
  "/admin/login",
  bruteForceProtection,
  sanitizeLoginInputs,
  async (req, res) => {
    const result = await authenticateAdmin(req.body.email, req.body.password);
    res.status(result.statusCode || 500).json(result);
  }
);

router.post(
  "/dentist/login",
  bruteForceProtection,
  sanitizeLoginInputs,
  async (req, res) => {
    const result = await authenticateDentist(req.body.email, req.body.password);
    res.status(result.statusCode || 500).json(result);
  }
);

router.post("/complete-profile", requireVerificationToken, async (req, res) => {
  const {
    fullName,
    phone,
    dob,
    gender,
    contactDetail,
    newPassword,
    confirmPassword,
  } = req.body || {};

  if (!fullName || !phone) {
    return res.status(400).json({
      success: false,
      message: "Name and phone required",
    });
  }

  const upsertFn =
    req.user.role === "admin"
      ? upsertAdminProfileDetails
      : upsertDentistProfileDetails;

  const result = await upsertFn(
    req.user.profileId,
    {
      fullName,
      phone,
      dob,
      gender,
      contactDetail,
      newPassword,
      confirmPassword,
    },
    req.user.id
  );

  if (!result.success) return res.status(400).json(result);

  return res.status(200).json({
    success: true,
    message: "Profile saved. Now verify with invitation OTP.",
  });
});

router.post("/verify-otp", requireVerificationToken, async (req, res) => {
  const result = await verifyOtpAndActivate({
    role: req.user.role,
    profileId: req.user.profileId,
    otp: req.body.otp,
  });

  if (!result.success) return res.status(result.statusCode).json(result);

  const profile = result.data;
  
  const assignedRole = profile.admin_type === 'super_admin' ? 'super_admin' : req.user.role;
  
  console.log("OTP VERIFICATION ASSIGNED ROLE:", assignedRole);

  const sessionToken = signToken({
    id: req.user.id,
    profileId: req.user.profileId,
    email: profile.email,
    name: profile.full_name || profile.name,
    role: assignedRole,
    adminType: profile.admin_type,
    branch: profile.branch,
    purpose: "session",
  });

  res.status(200).json({
    success: true,
    data: {
      token: sessionToken,
      profile,
      role: assignedRole,
    },
  });
});

router.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const { data: admin } = await supabaseAdmin
      .from("admin_list")
      .select("id, full_name, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    const { data: dentist } = await supabaseAdmin
      .from("dentist_list")
      .select("id, name, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    const user = admin || dentist;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account not found",
      });
    }

    const role = admin ? "admin" : "dentist";
    const otp = generateOtp();

    inMemoryOtpStore.set(`${role}:${user.id}:forgot_password`, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    await sendOtpEmail({
      email: cleanEmail,
      fullName: user.full_name || user.name,
      otp,
      role,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent",
      data: {
        role,
        profileId: user.id,
        email: cleanEmail,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
    });
  }
});

router.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();
    const cleanOtp = String(req.body.otp || "").trim();

    let { role, profileId } = req.body;

    if (!role || !profileId) {
      const { data: admin } = await supabaseAdmin
        .from("admin_list")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      const { data: dentist } = await supabaseAdmin
        .from("dentist_list")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (admin) {
        role = "admin";
        profileId = admin.id;
      } else if (dentist) {
        role = "dentist";
        profileId = dentist.id;
      }
    }

    const record = inMemoryOtpStore.get(`${role}:${profileId}:forgot_password`);

    if (
      !record ||
      record.otp !== cleanOtp ||
      new Date(record.expiresAt) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const resetToken = crypto.randomUUID();

    inMemoryOtpStore.set(`${resetToken}:reset_token`, {
      role,
      profileId,
      email: cleanEmail,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP.",
    });
  }
});

router.post("/forgot-password/reset", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const resetToken = authHeader.replace("Bearer ", "").trim();

    const { password, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        message: "Missing reset token.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation are required.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const resetRecord = inMemoryOtpStore.get(`${resetToken}:reset_token`);

    if (!resetRecord || new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired.",
      });
    }

    const tableName = ROLE_TABLE_MAP[resetRecord.role];

    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role.",
      });
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from(tableName)
      .select("id, email")
      .eq("id", resetRecord.profileId)
      .single();

    if (profileError || !profileData) {
      console.log(profileError);
      return res.status(400).json({ 
        success: false,
        message: "Account profile not found.",
      });
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(profileData.id, {
        password,
    });

    if (updateAuthError) {
      console.log(updateAuthError);
      return res.status(400).json({
        success: false,
        message: updateAuthError.message || "Password reset failed.",
      });
    }

    await supabaseAdmin
      .from(tableName)
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", resetRecord.profileId);

    inMemoryOtpStore.delete(
      `${resetRecord.role}:${resetRecord.profileId}:forgot_password`
    );
    inMemoryOtpStore.delete(`${resetToken}:reset_token`);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.log(error);

    return res.status(400).json({
      success: false,
      message: error.message || "Password reset failed.",
    });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({
    success: true,
  });
});

export default router;