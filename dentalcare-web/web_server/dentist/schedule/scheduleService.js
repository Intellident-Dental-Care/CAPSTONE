import { supabaseAdmin } from "../../shared/supabaseClient.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeLabel = (timeValue) => {
  if (!timeValue) return "-";
  const [rawHour = "0", rawMinute = "0"] = String(timeValue).split(":");
  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "-";

  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const addOneHour = (timeValue) => {
  const [rawHour = "0", rawMinute = "0"] = String(timeValue || "").split(":");
  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "-";

  const nextHour = (hour + 1) % 24;
  return toTimeLabel(`${String(nextHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
};

const toScheduleStatus = (status) => {
  const value = normalize(status);
  if (value === "completed") return "completed";
  if (value === "in_progress" || value === "in_treatment") return "in_treatment";
  if (value === "cancelled") return "cancelled";
  if (value === "confirmed") return "waiting";
  return "confirmed";
};

export const getDentistSchedule = async (dentistProfileId, { date, branch }) => {
  const targetDate = date || toIsoDate(new Date());

  const [scheduleResult, bookingResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_schedule")
      .select("branch")
      .eq("dentist_id", dentistProfileId)
      .eq("is_active", true),
    supabaseAdmin
      .from("bookings")
      .select("id, patient_name, appointment_time, status, service, branch, appointment_date")
      .eq("dentist_id", dentistProfileId)
      .eq("appointment_date", targetDate)
      .order("appointment_time", { ascending: true }),
  ]);

  if (bookingResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load schedule" };
  }

  const scheduleBranches = [...new Set((scheduleResult.data || []).map((item) => item.branch).filter(Boolean))];
  const bookingBranches = [...new Set((bookingResult.data || []).map((item) => item.branch).filter(Boolean))];
  const branches = [...new Set([...scheduleBranches, ...bookingBranches])];

  const normalizedBranch = normalize(branch);
  const appointments = (bookingResult.data || [])
    .filter((item) => (normalizedBranch ? normalize(item.branch) === normalizedBranch : true))
    .filter((item) => normalize(item.status) !== "cancelled")
    .map((item) => ({
      id: item.id,
      patientName: item.patient_name || "Unknown Patient",
      startTime: toTimeLabel(item.appointment_time),
      endTime: addOneHour(item.appointment_time),
      status: toScheduleStatus(item.status),
      service: item.service || "Dental Appointment",
      branch: item.branch || "-",
      date: item.appointment_date,
    }));

  return {
    success: true,
    statusCode: 200,
    data: {
      selectedDate: targetDate,
      branches,
      appointments,
      notifications: appointments.slice(0, 6).map((item, index) => ({
        id: item.id || index + 1,
        title: "Schedule Reminder",
        message: `${item.patientName} • ${item.service}`,
        time: item.startTime,
      })),
    },
  };
};
