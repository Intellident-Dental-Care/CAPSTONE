import { supabaseAdmin } from "../../shared/supabaseClient.js";

const dayLabel = (value) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return Number.isInteger(value) && value >= 0 && value <= 6 ? days[value] : "-";
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";
  const [h = "0", m = "00"] = String(timeValue).split(":");
  const hour = Number.parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const getDentistProfileDetails = async (dentistProfileId) => {
  const [profileResult, scheduleResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_list")
      .select("id, name, email, phone_number, specialization, license_number")
      .eq("id", dentistProfileId)
      .single(),
    supabaseAdmin
      .from("dentist_schedule")
      .select("id, branch, day_of_week, start_time, end_time, is_active")
      .eq("dentist_id", dentistProfileId)
      .order("day_of_week", { ascending: true }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return { success: false, statusCode: 404, message: "Dentist profile not found" };
  }

  const schedules = (scheduleResult.data || []).map((item) => ({
    id: item.id,
    day: dayLabel(item.day_of_week),
    branch: item.branch || "-",
    time: `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
    isActive: !!item.is_active,
  }));

  return {
    success: true,
    statusCode: 200,
    data: {
      id: profileResult.data.id,
      fullName: profileResult.data.name || "",
      email: profileResult.data.email || "",
      phone: profileResult.data.phone_number || "",
      specialization: profileResult.data.specialization || "",
      licenseNumber: profileResult.data.license_number || "",
      schedules,
      notifications: [],
    },
  };
};

export const updateDentistProfileDetails = async (dentistProfileId, payload = {}) => {
  const updates = {};

  if (typeof payload.fullName === "string") updates.name = payload.fullName.trim();
  if (typeof payload.email === "string") updates.email = payload.email.trim().toLowerCase();
  if (typeof payload.phone === "string") updates.phone_number = payload.phone.trim();
  if (typeof payload.specialization === "string") updates.specialization = payload.specialization.trim();
  if (typeof payload.licenseNumber === "string") updates.license_number = payload.licenseNumber.trim();

  if (!Object.keys(updates).length) {
    return { success: false, statusCode: 400, message: "No profile changes provided" };
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("dentist_list")
    .update(updates)
    .eq("id", dentistProfileId);

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to update profile" };
  }

  return getDentistProfileDetails(dentistProfileId);
};
