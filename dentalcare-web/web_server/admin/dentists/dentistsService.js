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

// --- 1. Main List Function ---
export const listDentistsWithSchedules = async () => {
  const todayDayOfWeek = new Date().getDay();

  const [dentistsResult, schedulesResult, leavesResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_list")
      .select("id, name, specialization, email, phone_number, is_active, created_at"),
    supabaseAdmin
      .from("dentist_schedule")
      .select("id, dentist_id, branch, day_of_week, start_time, end_time, is_active")
      .order("day_of_week", { ascending: true }),
    supabaseAdmin
      .from("dentist_leave")
      .select("id, dentist_id, start_date, end_date, reason, created_at, updated_by")
      .order("start_date", { ascending: true }),
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

  const leavesByDentist = new Map();
  for (const leave of leavesResult.data || []) {
    const current = leavesByDentist.get(leave.dentist_id) || [];
    current.push({
      id: leave.id,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason,
      created_at: leave.created_at,
      updated_by: leave.updated_by,
    });
    leavesByDentist.set(leave.dentist_id, current);
  }

  const mapped = (dentistsResult.data || []).map((dentist) => {
    const dentistSchedules = schedulesByDentist.get(dentist.id) || [];
    const dentistLeaves = leavesByDentist.get(dentist.id) || [];
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
      leave: dentistLeaves,
      currentBranchToday: todaySchedule?.branch || "No Schedule Today",
      currentScheduleToday: todaySchedule?.time || "No Schedule Today",
      currentDayToday: dayLabel(todayDayOfWeek),
    };
  });

  return { success: true, statusCode: 200, data: mapped };
};

// --- 2. Leave Management Functions ---
export const checkDentistLeaveConflict = async (dentistId, startDate, endDate) => {
  const { data, error } = await supabaseAdmin
    .from("dentist_leave")
    .select("id")
    .eq("dentist_id", dentistId)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (error) {
    console.error("Error checking leave conflict:", error);
    return { success: false, message: "Failed to check leave conflicts" };
  }

  if (data && data.length > 0) {
    return { success: false, message: "Dentist already has a leave during this period" };
  }

  return { success: true };
};

export const setDentistLeave = async (dentistId, startDate, endDate, reason, adminName) => {
  const conflict = await checkDentistLeaveConflict(dentistId, startDate, endDate);
  if (!conflict.success) {
    return conflict;
  }

  const { data, error } = await supabaseAdmin
    .from("dentist_leave")
    .insert([
      {
        dentist_id: dentistId,
        start_date: startDate,
        end_date: endDate,
        reason: reason || "",
        updated_by: adminName,
      },
    ])
    .select();

  if (error) {
    console.error("Error setting dentist leave:", error);
    return { success: false, statusCode: 500, message: "Failed to set leave" };
  }

  return { success: true, statusCode: 201, data: data[0] };
};

export const cancelDentistLeave = async (leaveId) => {
  const { error } = await supabaseAdmin
    .from("dentist_leave")
    .delete()
    .eq("id", leaveId);

  if (error) {
    console.error("Error canceling dentist leave:", error);
    return { success: false, statusCode: 500, message: "Failed to cancel leave" };
  }

  return { success: true, statusCode: 200, message: "Leave cancelled successfully" };
};

export const getDentistLeaves = async (dentistId) => {
  const { data, error } = await supabaseAdmin
    .from("dentist_leave")
    .select("*")
    .eq("dentist_id", dentistId)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching dentist leaves:", error);
    return { success: false, message: "Failed to fetch leaves" };
  }

  return { success: true, data: data || [] };
};