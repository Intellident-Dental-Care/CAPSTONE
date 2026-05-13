import { supabaseAdmin } from "../../shared/supabaseClient.js";

const dayLabel = (value) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return Number.isInteger(value) && value >= 0 && value <= 6 ? days[value] : "-";
};

const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));

const toShortTime = (value) => String(value || "").slice(0, 5);

const isEndAfterStart = (startTime, endTime) => String(endTime) > String(startTime);

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
      .select("id, name, email, phone_number, specialization, license_number, birthdate, about, experience_years")
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
    dayOfWeek: item.day_of_week,
    day: dayLabel(item.day_of_week),
    branch: item.branch || "-",
    startTime: toShortTime(item.start_time) || "09:00",
    endTime: toShortTime(item.end_time) || "18:00",
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
      birthdate: profileResult.data.birthdate || "",
      about: profileResult.data.about || "",
      experience_years: profileResult.data.experience_years || "",
      schedules,
      notifications: [],
    },
  };
};

export const updateDentistProfileDetails = async (dentistProfileId, payload = {}) => {
  const updates = {};
  const hasSchedulePayload = Array.isArray(payload.schedules);

  if (typeof payload.fullName === "string") updates.name = payload.fullName.trim();
  if (typeof payload.email === "string") updates.email = payload.email.trim().toLowerCase();
  if (typeof payload.phone === "string") updates.phone_number = payload.phone.trim();
  if (typeof payload.specialization === "string") updates.specialization = payload.specialization.trim();
  if (typeof payload.licenseNumber === "string") updates.license_number = payload.licenseNumber.trim();
  
  if (payload.birthdate !== undefined) updates.birthdate = payload.birthdate || null;
  if (typeof payload.about === "string") updates.about = payload.about.trim();
  if (payload.experience_years !== undefined) updates.experience_years = payload.experience_years ? String(payload.experience_years) : null;

  if (!Object.keys(updates).length && !hasSchedulePayload) {
    return { success: false, statusCode: 400, message: "No profile changes provided" };
  }

  const timestamp = new Date().toISOString();

  if (Object.keys(updates).length) {
    updates.updated_at = timestamp;

    const { error } = await supabaseAdmin
      .from("dentist_list")
      .update(updates)
      .eq("id", dentistProfileId);

    if (error) {
      return { success: false, statusCode: 500, message: "Failed to update profile" };
    }
  }

  if (hasSchedulePayload) {
    const normalizedSchedules = payload.schedules
      .map((item) => ({
        id: item?.id || null,
        dayOfWeek: Number(item?.dayOfWeek),
        branch: String(item?.branch || "").trim(),
        startTime: String(item?.startTime || ""),
        endTime: String(item?.endTime || ""),
        isActive: item?.isActive !== false,
      }))
      .filter((item) => Number.isInteger(item.dayOfWeek) && item.dayOfWeek >= 0 && item.dayOfWeek <= 6);

    const invalidTime = normalizedSchedules.some(
      (item) =>
        !isValidTime(item.startTime) ||
        !isValidTime(item.endTime) ||
        !isEndAfterStart(item.startTime, item.endTime)
    );

    if (invalidTime) {
      return { success: false, statusCode: 400, message: "Invalid schedule time format" };
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("dentist_schedule")
      .select("id, day_of_week, branch")
      .eq("dentist_id", dentistProfileId);

    if (existingError) {
      return { success: false, statusCode: 500, message: "Failed to load existing schedules" };
    }

    const existingByDay = new Map((existingRows || []).map((row) => [row.day_of_week, row]));

    for (const item of normalizedSchedules) {
      const existing = existingByDay.get(item.dayOfWeek);
      const hasBranch = item.branch.length > 0;

      if (existing?.id) {
        // Keep existing record but allow dentist to clear branch by marking the slot inactive.
        const rowPayload = {
          day_of_week: item.dayOfWeek,
          branch: hasBranch ? item.branch : existing.branch,
          start_time: item.startTime,
          end_time: item.endTime,
          is_active: hasBranch ? item.isActive : false,
        };

        const { error: updateError } = await supabaseAdmin
          .from("dentist_schedule")
          .update(rowPayload)
          .eq("id", existing.id)
          .eq("dentist_id", dentistProfileId);

        if (updateError) {
          return { success: false, statusCode: 500, message: "Failed to update schedule" };
        }
      } else {
        // Do not insert incomplete rows when no branch is selected for that day.
        if (!hasBranch) {
          continue;
        }

        const { error: insertError } = await supabaseAdmin
          .from("dentist_schedule")
          .insert({
            dentist_id: dentistProfileId,
            day_of_week: item.dayOfWeek,
            branch: item.branch,
            start_time: item.startTime,
            end_time: item.endTime,
            is_active: item.isActive,
            slot_minutes: 30,
            created_at: timestamp,
          });

        if (insertError) {
          return { success: false, statusCode: 500, message: "Failed to save schedule" };
        }
      }
    }
  }

  return getDentistProfileDetails(dentistProfileId);
};