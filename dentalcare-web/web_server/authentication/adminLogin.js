import { supabaseAdmin, supabaseAuth, signToken, signTokenWithExpiry, verifyToken } from "./authUtils.js";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const resolveAdminProfileByIdentifier = async (identifier) => {
  const normalized = String(identifier || "").trim().toLowerCase();
  const raw = String(identifier || "").trim();

  if (!raw) return null;

  const byEmail = await supabaseAdmin
    .from("admin_list")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (!byEmail.error && byEmail.data) {
    return byEmail.data;
  }

  if (!raw.includes("@")) {
    const byName = await supabaseAdmin
      .from("admin_list")
      .select("*")
      .ilike("full_name", raw)
      .maybeSingle();

    if (!byName.error && byName.data) {
      return byName.data;
    }
  }

  return null;
};

/**
 * Authenticate admin with email and password
 * @param {string} email - Admin email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} - Authentication result
 */
export const authenticateAdmin = async (email, password) => {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
        statusCode: 400,
      };
    }

    const identifier = String(email || "").trim();
    const admin = await resolveAdminProfileByIdentifier(identifier);

    if (!admin) {
      return {
        success: false,
        message: 'Invalid email or password',
        statusCode: 401,
      };
    }

    const authEmail = String(admin.email || "").trim().toLowerCase();
    if (!isValidEmail(authEmail)) {
      return {
        success: false,
        message: "Account setup incomplete. Contact support.",
        statusCode: 403,
      };
    }

    const { data: authResult, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (authError) {
      const authMessage = String(authError?.message || "");
      const lowerAuthMessage = authMessage.toLowerCase();
      const isSchemaIssue =
        lowerAuthMessage.includes("database error querying schema") ||
        lowerAuthMessage.includes("database error") ||
        lowerAuthMessage.includes("querying schema");

      console.log("[ADMIN_LOGIN_AUTH_ERROR]", {
        message: authMessage,
        code: authError?.code,
        status: authError?.status,
        isSchemaIssue,
      });

      if (isSchemaIssue) {
        return {
          success: false,
          message: "Authentication service is misconfigured. Please contact support.",
          statusCode: 500,
        };
      }

      return {
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      };
    }

    if (!authResult?.user) {
      return {
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      };
    }

    if (!admin.is_active) {
      return {
        success: false,
        message: "Account is inactive. Contact support.",
        statusCode: 403,
      };
    }

    if (!admin.is_verified) {
      const verificationToken = signTokenWithExpiry(
        {
          id: authResult.user.id,
          profileId: admin.id,
          email: admin.email,
          role: "admin",
          purpose: "verify",
        },
        "2h"
      );

      return {
        success: true,
        requiresVerification: true,
        message: "Profile completion and email OTP verification required.",
        statusCode: 200,
        data: {
          verificationToken,
          profile: {
            id: admin.id,
            email: admin.email,
            fullName: admin.full_name,
            phone: admin.phone_number,
            isVerified: admin.is_verified,
          },
        },
      };
    }

    const token = signToken({
      id: authResult.user.id,
      profileId: admin.id,
      email: admin.email,
      name: admin.full_name,
      role: "admin",
      adminType: admin.admin_type,
      branch: admin.branch,
      purpose: "session",
    });

    return {
      success: true,
      message: "Login successful",
      statusCode: 200,
      data: {
        token,
        admin: {
          id: admin.id,
          authUserId: authResult.user.id,
          email: admin.email,
          fullName: admin.full_name,
          adminType: admin.admin_type,
          phone: admin.phone_number,
          branch: admin.branch,
          isVerified: admin.is_verified,
          permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
        },
      },
    };
  } catch (error) {
    console.error("Admin authentication error:", error);
    return {
      success: false,
      message: "Authentication failed. Please try again later.",
      statusCode: 500,
      error: error.message,
    };
  }
};

/**
 * Verify admin token
 * @param {string} token - JWT token
 * @returns {Promise<object>} - Verification result
 */
export const verifyAdminToken = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'Token is required',
        statusCode: 400,
      };
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "admin" || decoded.purpose !== "session") {
      return {
        success: false,
        message: "Invalid token",
        statusCode: 401,
      };
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admin_list")
      .select("id, email, full_name, is_active, admin_type, branch")
      .eq("id", decoded.profileId || decoded.id)
      .single();

    if (error || !admin || !admin.is_active) {
      return {
        success: false,
        message: "Admin account not found or inactive",
        statusCode: 401,
      };
    }

    return {
      success: true,
      message: "Token is valid",
      statusCode: 200,
      data: {
        ...decoded,
        branch: admin.branch,
        adminType: admin.admin_type,
      },
    };
  } catch (error) {
    console.error("Admin token verification error:", error);
    return {
      success: false,
      message: "Token verification failed",
      statusCode: 401,
      error: error.message,
    };
  }
};

/**
 * Get admin profile by ID
 * @param {string} adminId - Admin ID
 * @returns {Promise<object>} - Admin profile data
 */
export const getAdminProfile = async (adminId) => {
  try {
    if (!adminId) {
      return {
        success: false,
        message: 'Admin ID is required',
        statusCode: 400,
      };
    }

    const { data: admin, error } = await supabaseAdmin
      .from("admin_list")
      .select("*")
      .eq("id", adminId)
      .single();

    if (error || !admin) {
      return {
        success: false,
        message: 'Admin not found',
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Profile retrieved successfully",
      statusCode: 200,
      data: {
        ...admin,
        permissions: Array.isArray(admin.permissions) ? admin.permissions : [],
      },
    };
  } catch (error) {
    console.error("Get admin profile error:", error);
    return {
      success: false,
      message: "Failed to retrieve profile",
      statusCode: 500,
      error: error.message,
    };
  }
};

/**
 * Check if admin has specific permission
 * @param {string} adminId - Admin ID
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>} - True if admin has permission
 */
export const checkAdminPermission = async (adminId, permission) => {
  try {
    const { data: admin, error } = await supabaseAdmin
      .from("admin_list")
      .select("permissions")
      .eq("id", adminId)
      .single();

    if (error || !admin) {
      return false;
    }

    const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
    return permissions.includes(permission);
  } catch (error) {
    console.error("Check admin permission error:", error);
    return false;
  }
};

export const upsertAdminProfileDetails = async (adminId, details, authUserId) => {
  const cleanEmail = String(details.contactDetail || "").trim().toLowerCase();

  if (details.newPassword || details.confirmPassword) {
    if (!details.newPassword || !details.confirmPassword) {
      return { success: false, message: "Both password fields are required" };
    }

    if (details.newPassword !== details.confirmPassword) {
      return { success: false, message: "Password confirmation does not match" };
    }

    if (String(details.newPassword).length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }
  }

  const payload = {
    full_name: details.fullName,
    phone_number: details.phone,
    updated_at: new Date().toISOString(),
  };

  try {
    const noteObj = {
      dob: details.dob || null,
      gender: details.gender || null,
      contactDetail: details.contactDetail || null,
    };

    if (Object.values(noteObj).some((v) => v)) {
      payload.notes = JSON.stringify(noteObj);
    }

    if (cleanEmail) {
      payload.email = cleanEmail;
    }

    const { error } = await supabaseAdmin
      .from("admin_list")
      .update(payload)
      .eq("id", adminId);

    if (error) {
      return { success: false, message: "Failed to update admin profile details" };
    }

    if (authUserId && (cleanEmail || details.newPassword)) {
      const authPayload = {
        ...(cleanEmail ? { email: cleanEmail, email_confirm: true } : {}),
        ...(details.newPassword ? { password: details.newPassword } : {}),
      };

      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, authPayload);
      if (authUpdateError) {
        return { success: false, message: "Profile saved but failed to update account credentials" };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: "Failed to update admin profile details" };
  }
};

export default {
  authenticateAdmin,
  verifyAdminToken,
  getAdminProfile,
  checkAdminPermission,
};
