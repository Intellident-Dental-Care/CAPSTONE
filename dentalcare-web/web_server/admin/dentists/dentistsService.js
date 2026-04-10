import { supabaseAdmin } from "../../shared/supabaseClient.js";

const dayLabel = (value) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Number.isInteger(value) && value >= 0 && value <= 6 ? days[value] : "-";
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";
  const [h = "0", m = "00"] = String(timeValue).split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

const statusFromActive = (isActive) => (isActive ? "Available" : "Leave");

export const listDentistsWithSchedules = async () => {
  const todayDayOfWeek = new Date().getDay();

  const [dentistsResult, schedulesResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_list")
      .select("id, name, specialization, email, phone_number, is_active, created_at"),
    supabaseAdmin
      .from("dentist_schedule")
      .select("id, dentist_id, branch, day_of_week, start_time, end_time, is_active")
      .order("day_of_week", { ascending: true }),
  ]);

  if (dentistsResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load dentists" };
  }

  if (schedulesResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load dentist schedules" };
  }

  const schedulesByDentist = new Map();
  for (const schedule of schedulesResult.data || []) {
    const current = schedulesByDentist.get(schedule.dentist_id) || [];
    current.push({
      id: schedule.id,
      branch: schedule.branch || "-",
      day: dayLabel(schedule.day_of_week),
      days: dayLabel(schedule.day_of_week),
      time: `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`,
      active: !!schedule.is_active,
    });
    schedulesByDentist.set(schedule.dentist_id, current);
  }

  const mapped = (dentistsResult.data || []).map((dentist) => {
    const dentistSchedules = schedulesByDentist.get(dentist.id) || [];
    const todaySchedule = dentistSchedules.find((item) => item.active && item.day === dayLabel(todayDayOfWeek)) || null;

    return {
    id: dentist.id,
    name: dentist.name || "Unnamed Dentist",
    specialty: dentist.specialization || "General Dentistry",
    phone: dentist.phone_number || "",
    email: dentist.email || "",
    status: statusFromActive(dentist.is_active),
    birthday: dentist.created_at || null,
    sex: "-",
    schedules: dentistSchedules,
    currentBranchToday: todaySchedule?.branch || "No Branch Today",
    currentScheduleToday: todaySchedule?.time || "No Schedule Today",
    currentDayToday: dayLabel(todayDayOfWeek),
  };
  });

  return { success: true, statusCode: 200, data: mapped };
};
