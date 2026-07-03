import { supabaseAdmin } from "../../shared/supabaseClient.js";

const ADMIN_AVATAR_BUCKET = "profile-uploads";
const getAvatarStoragePath = (adminId) => `user_${String(adminId || "").trim()}/profile_main`;
const sanitizeFileName = (value) => String(value || "avatar.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");

const safeParseNotes = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// Updated to query and return profile_photo_url from the table
export const getAdminProfileById = async (adminId) => {
  const { data, error } = await supabaseAdmin
    .from("admin_list")
    .select("id, full_name, email, phone_number, admin_type, branch, notes, profile_photo_url, is_active, is_verified, updated_at")
    .eq("id", adminId)
    .single();

  if (error || !data) {
    console.error("Error fetching admin profile:", error);
    return { success: false, statusCode: 404, message: "Admin profile not found" };
  }

  const notes = safeParseNotes(data.notes);

  return {
    success: true,
    statusCode: 200,
    data: {
      id: data.id,
      fullName: data.full_name || "",
      email: data.email || "",
      phone: data.phone_number || "",
      adminType: data.admin_type || "",
      branch: data.branch || "",
      dob: notes.dob || "",
      gender: notes.gender || "",
      contactDetail: notes.contactDetail || data.email || "",
      // Added fallback chain to prioritize the database column field
      avatarUrl: data.profile_photo_url || "",
      avatarPath: data.profile_photo_url || "",
      isActive: !!data.is_active,
      isVerified: !!data.is_verified,
      updatedAt: data.updated_at || null,
    },
  };
};

const uploadBase64ToSupabase = async (bucket, path, base64Str) => {
  const matches = String(base64Str || "").match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Admin avatar upload error:", error);
    throw error;
  }

  return path;
};

// Added persistent DB update block to store the bucket path inside your table editor column
export const updateAdminAvatarById = async (adminId, payload = {}) => {
  const avatarBase64 = String(payload.avatarBase64 || "").trim();
  const fileName = sanitizeFileName(payload.fileName || "avatar.jpg");

  if (!avatarBase64) {
    return { success: false, statusCode: 400, message: "Image data is required" };
  }

  const avatarPath = `${getAvatarStoragePath(adminId)}/avatar_${Date.now()}_${fileName}`;
  const storedPath = await uploadBase64ToSupabase(ADMIN_AVATAR_BUCKET, avatarPath, avatarBase64);

  if (!storedPath) {
    return { success: false, statusCode: 400, message: "Invalid image data" };
  }

  // Persist path link directly to profile_photo_url column inside admin_list table
  const { error: dbUpdateError } = await supabaseAdmin
    .from("admin_list")
    .update({ 
      profile_photo_url: storedPath,
      updated_at: new Date().toISOString()
    })
    .eq("id", adminId);

  if (dbUpdateError) {
    console.error("Failed to persist avatar URL string to admin_list:", dbUpdateError);
    return { success: false, statusCode: 500, message: "Avatar uploaded but failed to save reference link." };
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      avatarUrl: storedPath,
      avatarPath: storedPath,
    },
  };
};

export const updateAdminProfileById = async (adminId, payload) => {
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (typeof payload.fullName === "string") {
    updates.full_name = payload.fullName.trim();
  }
  if (typeof payload.phone === "string") {
    updates.phone_number = payload.phone.trim();
  }
  if (typeof payload.email === "string" && payload.email.trim()) {
    updates.email = payload.email.trim().toLowerCase();
  }

  const noteObj = {
    dob: payload.dob || null,
    gender: payload.gender || null,
    contactDetail: payload.contactDetail || payload.email || null,
  };

  updates.notes = JSON.stringify(noteObj);

  const { error } = await supabaseAdmin
    .from("admin_list")
    .update(updates)
    .eq("id", adminId);

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to update profile" };
  }

  return getAdminProfileById(adminId);
};