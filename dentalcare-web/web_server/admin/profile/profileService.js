import { supabaseAdmin } from "../../shared/supabaseClient.js";

const safeParseNotes = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const getAdminProfileById = async (adminId) => {
  const { data, error } = await supabaseAdmin
    .from("admin_list")
    .select("id, full_name, email, phone_number, admin_type, branch, notes, is_active, is_verified, updated_at")
    .eq("id", adminId)
    .single();

  if (error || !data) {
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
      isActive: !!data.is_active,
      isVerified: !!data.is_verified,
      updatedAt: data.updated_at || null,
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
