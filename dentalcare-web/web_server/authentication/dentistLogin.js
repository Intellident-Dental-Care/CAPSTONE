import { supabaseAdmin, supabaseAuth, signToken, signTokenWithExpiry, verifyToken } from "./authUtils.js";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const resolveDentistProfileByIdentifier = async (identifier) => {
  const normalized = String(identifier || "").trim().toLowerCase();
  const raw = String(identifier || "").trim();

  if (!raw) return null;

  const byEmail = await supabaseAdmin
    .from("dentist_list")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (!byEmail.error && byEmail.data) {
    return byEmail.data;
  }

  if (!raw.includes("@")) {
    const byName = await supabaseAdmin
      .from("dentist_list")
      .select("*")
      .ilike("name", raw)
      .maybeSingle();

    if (!byName.error && byName.data) {
      return byName.data;
    }
  }

  return null;
};

/**
 * Authenticate dentist with email and password
 * @param {string} email - Dentist email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} - Authentication result
 */
export const authenticateDentist = async (email, password) => {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required',
        statusCode: 400,
      };
    }

    const identifier = String(email || "").trim();
    const dentist = await resolveDentistProfileByIdentifier(identifier);

    if (!dentist) {
      return {
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      };
    }

    const authEmail = String(dentist.email || "").trim().toLowerCase();
    if (!isValidEmail(authEmail)) {
      return {
        success: false,
        message: "Account setup incomplete. Contact administrator.",
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

      console.log("[DENTIST_LOGIN_AUTH_ERROR]", {
        message: authMessage,
        code: authError?.code,
        status: authError?.status,
        isSchemaIssue,
      });

      if (isSchemaIssue) {
        return {
          success: false,
          message: "Authentication service is misconfigured. Please contact administrator.",
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

    if (!dentist.is_active) {
      return {
        success: false,
        message: "This account has been disabled by an Administrator",
        statusCode: 403,
      };
    }

    if (!dentist.is_verified) {
      const verificationToken = signTokenWithExpiry(
        {
          id: authResult.user.id,
          profileId: dentist.id,
          email: dentist.email,
          role: "dentist",
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
            id: dentist.id,
            email: dentist.email,
            fullName: dentist.name,
            phone: dentist.phone_number,
            isVerified: dentist.is_verified,
          },
        },
      };
    }

    const token = signToken({
      id: authResult.user.id,
      profileId: dentist.id,
      email: dentist.email,
      name: dentist.name,
      role: "dentist",
      purpose: "session",
    });

    return {
      success: true,
      message: "Login successful",
      statusCode: 200,
      data: {
        token,
        dentist: {
          ...dentist,
          authUserId: authResult.user.id,
          fullName: dentist.name,
          specialty: dentist.specialization,
          licenseNumber: dentist.license_number,
          phone: dentist.phone_number,
          yearsExperience: dentist.experience_years,
        },
      },
    };
  } catch (error) {
    console.error("Dentist authentication error:", error);
    return {
      success: false,
      message: "Authentication failed. Please try again later.",
      statusCode: 500,
      error: error.message,
    };
  }
};

/**
 * Verify dentist token
 * @param {string} token - JWT token
 * @returns {Promise<object>} - Verification result
 */
export const verifyDentistToken = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'Token is required',
        statusCode: 400,
      };
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "dentist" || decoded.purpose !== "session") {
      return {
        success: false,
        message: "Invalid token",
        statusCode: 401,
      };
    }

    const { data: dentist, error } = await supabaseAdmin
      .from("dentist_list")
      .select("id, email, name, is_active")
      .eq("id", decoded.profileId || decoded.id)
      .single();

    if (error || !dentist || !dentist.is_active) {
      return {
        success: false,
        message: "Dentist account not found or inactive",
        statusCode: 401,
      };
    }

    return {
      success: true,
      message: "Token is valid",
      statusCode: 200,
      data: decoded,
    };
  } catch (error) {
    console.error("Dentist token verification error:", error);
    return {
      success: false,
      message: "Token verification failed",
      statusCode: 401,
      error: error.message,
    };
  }
};

/**
 * Get dentist profile by ID
 * @param {string} dentistId - Dentist ID
 * @returns {Promise<object>} - Dentist profile data
 */
export const getDentistProfile = async (dentistId) => {
  try {
    if (!dentistId) {
      return {
        success: false,
        message: 'Dentist ID is required',
        statusCode: 400,
      };
    }

    const { data: dentist, error } = await supabaseAdmin
      .from("dentist_list")
      .select("*")
      .eq("id", dentistId)
      .single();

    if (error || !dentist) {
      return {
        success: false,
        message: 'Dentist not found',
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Profile retrieved successfully",
      statusCode: 200,
      data: dentist,
    };
  } catch (error) {
    console.error("Get dentist profile error:", error);
    return {
      success: false,
      message: "Failed to retrieve profile",
      statusCode: 500,
      error: error.message,
    };
  }
};

export const upsertDentistProfileDetails = async (dentistId, details, authUserId) => {
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
    updated_at: new Date().toISOString(),
  };

  // Only update name and phone if they're provided (not null)
  if (details.fullName !== null && details.fullName !== undefined) {
    payload.name = details.fullName;
  }
  if (details.phone !== null && details.phone !== undefined) {
    payload.phone_number = details.phone;
  }

  try {
    if (cleanEmail) {
      payload.email = cleanEmail;
    }

    const { error } = await supabaseAdmin
      .from("dentist_list")
      .update(payload)
      .eq("id", dentistId);

    if (error) {
      return { success: false, message: "Failed to update dentist profile details" };
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
    return { success: false, message: "Failed to update dentist profile details" };
  }
};

export default {
  authenticateDentist,
  verifyDentistToken,
  getDentistProfile,
};
