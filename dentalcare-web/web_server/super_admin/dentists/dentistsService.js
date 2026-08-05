import { supabaseAdmin } from "../../shared/supabaseClient.js";
import { generateTempPassword } from "../../nodemailer/passwordGenerator.js";
import { generateOtp, sendOtpEmail } from "../../nodemailer/emailOtpService.js";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const branchToDatabaseValue = (branch) => {
  const value = String(branch || "").trim().toLowerCase();
  if (value.includes("dasma")) return "Dasmarinas, Cavite";
  if (value.includes("gentri") || value.includes("trias")) return "General Trias, Cavite";
  if (value.includes("bacoor")) return "Bacoor, Cavite";
  return String(branch || "").trim();
};

const dayToNumber = (day) => {
  const value = String(day || "").trim().toLowerCase();
  const map = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  return map[value] ?? 1;
};

const to24HourTime = (rawValue) => {
  const value = String(rawValue || "").trim().toUpperCase();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3];

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
};

const parseTimeRange = (timeRange) => {
  const [startRaw = "", endRaw = ""] = String(timeRange || "").split("-").map((part) => part.trim());
  const start = to24HourTime(startRaw);
  const end = to24HourTime(endRaw);

  if (!start || !end) {
    return { start_time: "09:00:00", end_time: "17:00:00" };
  }

  return { start_time: start, end_time: end };
};

const findDuplicateScheduleKey = (schedules = []) => {
  const seen = new Set();

  for (const schedule of schedules) {
    const normalizedDay = dayToNumber(schedule.day);
    const { start_time, end_time } = parseTimeRange(schedule.time);
    const key = `${normalizedDay}|${start_time}|${end_time}`;

    if (seen.has(key)) {
      return key;
    }

    seen.add(key);
  }

  return null;
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";
  const [h = "0", m = "00"] = String(timeValue).split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const getDentistsList = async () => {
  try {
    const { data: dentists, error } = await supabaseAdmin
      .from("dentist_list")
      .select("*, dentist_schedule(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = dentists.map((dentist) => ({
      id: dentist.id,
      name: dentist.name,
      specialty: dentist.specialization || "General Dentistry",
      contactNumber: dentist.phone_number || "N/A",
      email: dentist.email,
      yearsExperience: dentist.experience_years || 0,
      status: dentist.is_active ? "Active" : "Disabled",
      isProfileCompleted: dentist.is_verified,
      schedules: (dentist.dentist_schedule || []).map((s) => ({
        branch: s.branch,
        day: DAY_LABELS[s.day_of_week] || s.day_of_week,
        time: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
        active: s.is_active,
      })),
    }));

    return { success: true, statusCode: 200, data: mapped };
  } catch (error) { return { success: false, statusCode: 500, message: error.message }; }
};

export const createDentistAccount = async (payload) => {
  try {
    const duplicateKey = findDuplicateScheduleKey(payload.schedules || []);
    if (duplicateKey) {
      return {
        success: false,
        statusCode: 400,
        message: "Duplicate schedules are not allowed for the same day and time.",
      };
    }

    const tempPassword = generateTempPassword();
    const otp = generateOtp();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { data: dentistData, error: dbError } = await supabaseAdmin
      .from("dentist_list")
      .insert({
        id: authData.user.id,
        name: payload.name,
        email: payload.email,
        phone_number: payload.contactNumber,
        specialization: payload.specialty,
        experience_years: payload.yearsExperience,
        is_active: true,
        is_verified: false,
        verification_otp: otp,
      })
      .select()
      .single();
    if (dbError) throw dbError;

    if (payload.schedules?.length > 0) {
      const scheduleRows = payload.schedules.map((s) => ({
        dentist_id: authData.user.id,
        branch: branchToDatabaseValue(s.branch),
        day_of_week: dayToNumber(s.day),
        ...parseTimeRange(s.time),
        slot_minutes: Number(s.slot_minutes || s.slotMinutes || 30),
        is_active: true,
      }));

      const { error: scheduleError } = await supabaseAdmin.from("dentist_schedule").insert(scheduleRows);
      if (scheduleError) throw scheduleError;
    }

    await sendOtpEmail({
      email: payload.email,
      fullName: payload.name,
      otp,
      role: "dentist",
      tempPassword,
    });

    return { success: true, statusCode: 201, data: dentistData };
  } catch (error) { return { success: false, statusCode: 500, message: error.message }; }
};

export const updateDentistStatus = async (id, isActive) => {
  try {
    const { data, error } = await supabaseAdmin.from("dentist_list").update({ is_active: isActive }).eq("id", id).select().single();
    if (error) throw error;
    return { success: true, statusCode: 200, data: { ...data, status: data.is_active ? "Active" : "Disabled" } };
  } catch (error) { return { success: false, statusCode: 500, message: error.message }; }
};

export const updateDentistSchedules = async (id, schedules = []) => {
  try {
    if (!id) {
      return { success: false, statusCode: 400, message: "Dentist id is required" };
    }

    if (!Array.isArray(schedules)) {
      return { success: false, statusCode: 400, message: "schedules must be an array" };
    }

    const duplicateKey = findDuplicateScheduleKey(schedules);
    if (duplicateKey) {
      return {
        success: false,
        statusCode: 400,
        message: "Duplicate schedules are not allowed for the same day and time.",
      };
    }

    const { error: deleteError } = await supabaseAdmin
      .from("dentist_schedule")
      .delete()
      .eq("dentist_id", id);
    if (deleteError) throw deleteError;

    if (schedules.length > 0) {
      const scheduleRows = schedules.map((s) => ({
        dentist_id: id,
        branch: branchToDatabaseValue(s.branch),
        day_of_week: dayToNumber(s.day),
        ...parseTimeRange(s.time),
        slot_minutes: Number(s.slot_minutes || s.slotMinutes || 30),
        is_active: true,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("dentist_schedule")
        .insert(scheduleRows);
      if (insertError) throw insertError;
    }

    return { success: true, statusCode: 200, message: "Schedules updated successfully" };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};