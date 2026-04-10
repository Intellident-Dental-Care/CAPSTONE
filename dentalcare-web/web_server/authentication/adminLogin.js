import { supabaseAdmin, supabaseAuth, signToken, signTokenWithExpiry, verifyToken } from "./authUtils.js";
import crypto from "crypto";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const parseBooleanEnv = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

// Simple password hashing for fallback auth when Supabase auth fails
const hashPasswordForFallback = (password) => {
  const salt = "admin_fallback_salt_2024";
  return crypto.createHash("sha256").update(password + salt).digest("hex");
};

const verifyPasswordForFallback = (password, hash) => {
  const computedHash = hashPasswordForFallback(password);
  return computedHash === hash;
};

const canUseBootstrapFallback = (identifier, password, adminEmail, adminFullName) => {
  const isEnabled = parseBooleanEnv(
    process.env.ADMIN_LOGIN_SCHEMA_FALLBACK,
    process.env.NODE_ENV !== "production"
  );

  if (!isEnabled) return false;

  const defaultUsernames = "EAGAdmin,EGAdmin";
  const configuredUsernames = String(process.env.BOOTSTRAP_ADMIN_USERNAMES || defaultUsernames);
  const usernames = configuredUsernames
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  const expectedUsername = String(process.env.BOOTSTRAP_ADMIN_USERNAME || "").trim().toLowerCase();
  const expectedPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin123!").trim();
  const expectedEmail = String(process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();

  const providedIdentifier = String(identifier || "").trim();
  const providedPassword = String(password || "").trim();
  const normalizedAdminEmail = String(adminEmail || "").trim().toLowerCase();
  const normalizedAdminFullName = String(adminFullName || "").trim().toLowerCase();

  if (expectedUsername) {
    usernames.push(expectedUsername);
  }

  if (normalizedAdminFullName) {
    usernames.push(normalizedAdminFullName);
  }

  const uniqueUsernames = [...new Set(usernames)];

  const isExpectedIdentifier =
    uniqueUsernames.includes(providedIdentifier.toLowerCase()) ||
    providedIdentifier.toLowerCase() === normalizedAdminEmail;

  const isExpectedPassword = providedPassword === expectedPassword;
  const isExpectedEmail = !expectedEmail || expectedEmail === normalizedAdminEmail;

  return isExpectedIdentifier && isExpectedPassword && isExpectedEmail;
};

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

    let authUser = authResult?.user || null;
    let usedSchemaFallback = false;

    if (authError) {
      const authMessage = String(authError?.message || "");
      const lowerAuthMessage = authMessage.toLowerCase();
      const isSchemaIssue =
        lowerAuthMessage.includes("database error querying schema") ||
        lowerAuthMessage.includes("database error") ||
        lowerAuthMessage.includes("querying schema");
      const isInvalidCredentials =
        authError?.code === "invalid_credentials" ||
        lowerAuthMessage.includes("invalid login credentials") ||
        lowerAuthMessage.includes("invalid credentials");

      console.log("[ADMIN_LOGIN_AUTH_ERROR]", {
        message: authMessage,
        code: authError?.code,
        status: authError?.status,
        isSchemaIssue,
      });

      if (
        (isSchemaIssue || isInvalidCredentials) &&
        canUseBootstrapFallback(identifier, password, admin.email, admin.full_name)
      ) {
        usedSchemaFallback = true;
        authUser = { id: admin.id };
      } else if (isSchemaIssue) {
        return {
          success: false,
          message: "Authentication service is misconfigured. Please contact support.",
          statusCode: 500,
        };
      }

      if (!isSchemaIssue && !usedSchemaFallback) {
        // Check if this is a case where admin exists in admin_list but not in Supabase auth
        // Use fallback authentication when Supabase auth user doesn't exist
        if (isInvalidCredentials && admin?.id && admin?.email) {
          console.log("[ADMIN_LOGIN_MISSING_AUTH_USER_ATTEMPTING_FALLBACK]", {
            adminId: admin.id,
            adminEmail: admin.email,
          });

          // First try the bootstrap fallback
          const canFallback = canUseBootstrapFallback(identifier, password, admin.email, admin.full_name);
          if (canFallback) {
            usedSchemaFallback = true;
            authUser = { id: admin.id };
            console.log("[ADMIN_LOGIN_USING_BOOTSTRAP_FALLBACK]", {
              adminId: admin.id,
              adminEmail: admin.email,
            });
          } else {
            // Try fallback password hash from forgot-password flow
            try {
              const notes = admin.notes ? JSON.parse(String(admin.notes)) : {};
              if (notes.fallback_password_hash && verifyPasswordForFallback(password, notes.fallback_password_hash)) {
                usedSchemaFallback = true;
                authUser = { id: admin.id };
                console.log("[ADMIN_LOGIN_USING_PASSWORD_HASH_FALLBACK]", {
                  adminId: admin.id,
                  adminEmail: admin.email,
                });
              } else {
                console.log("[ADMIN_LOGIN_FALLBACK_PASSWORD_MISMATCH_OR_NOT_SET]", {
                  adminId: admin.id,
                  adminEmail: admin.email,
                  hasFallbackHash: !!notes.fallback_password_hash,
                });

                return {
                  success: false,
                  message: "Your account needs to be set up. Please use 'Forgot Password' to complete the authentication setup.",
                  statusCode: 401,
                  data: {
                    accountNeedsSetup: true,
                    email: admin.email,
                  },
                };
              }
            } catch (err) {
              console.warn("[ADMIN_LOGIN_FALLBACK_PARSE_ERROR]", err?.message);

              return {
                success: false,
                message: "Your account needs to be set up. Please use 'Forgot Password' to complete the authentication setup.",
                statusCode: 401,
                data: {
                  accountNeedsSetup: true,
                  email: admin.email,
                },
              };
            }
          }
        }

        if (!usedSchemaFallback) {
          return {
            success: false,
            message: "Invalid email or password",
            statusCode: 401,
          };
        }
      }
    }

    if (!authUser) {
      return {
        success: false,
        message: "Invalid email or password",
        statusCode: 401,
      };
    }

    if (!admin.is_active) {
      return {
        success: false,
        message: "This account has been disabled by an Administrator",
        statusCode: 403,
      };
    }

    if (!admin.is_verified) {
      const verificationToken = signTokenWithExpiry(
        {
          id: authUser.id,
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
      id: authUser.id,
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
          authUserId: authUser.id,
          email: admin.email,
          fullName: admin.full_name,
          adminType: admin.admin_type,
          phone: admin.phone_number,
          branch: admin.branch,
          isVerified: admin.is_verified,
          usedSchemaFallback,
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
    updated_at: new Date().toISOString(),
  };

  // Only update name and phone if they're provided (not null)
  if (details.fullName !== null && details.fullName !== undefined) {
    payload.full_name = details.fullName;
  }
  if (details.phone !== null && details.phone !== undefined) {
    payload.phone_number = details.phone;
  }

  try {
    const noteObj = {
      dob: details.dob || null,
      gender: details.gender || null,
      contactDetail: details.contactDetail || null,
    };

    // Store password hash for fallback auth if authUserId doesn't exist and password is being set
    if (!authUserId && details.newPassword) {
      noteObj.fallback_password_hash = hashPasswordForFallback(details.newPassword);
      console.log("[ADMIN_PROFILE_STORING_FALLBACK_PASSWORD]", {
        adminId,
        email: cleanEmail,
      });
    }

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
        console.warn("[ADMIN_PROFILE_AUTH_UPDATE_ERROR]", {
          adminId,
          authUserId,
          code: authUpdateError?.code,
          message: authUpdateError?.message,
          status: authUpdateError?.status,
        });

        // Do not block profile completion and OTP flow when auth credential
        // sync fails due upstream auth service issues.
        return {
          success: true,
          credentialsUpdated: false,
          warning: "Profile saved but failed to update account credentials",
        };
      }

      return { success: true, credentialsUpdated: true };
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
