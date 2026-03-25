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

const parseMinutes = (timeValue) => {
  const [rawHour = "0", rawMinute = "0"] = String(timeValue || "").split(":");
  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
};

const mapPatientStatus = (status, queuePosition) => {
  const normalized = normalize(status);

  if (normalized === "in_progress" || normalized === "in_treatment") {
    return { status: "In Progress", type: "progress" };
  }

  if (normalized === "confirmed") {
    if (queuePosition === 0) return { status: "Next Client", type: "next" };
    return { status: "Waiting", type: "waiting" };
  }

  if (normalized === "completed") return { status: "Completed", type: "progress" };
  if (normalized === "cancelled") return { status: "Cancelled", type: "waiting" };

  return { status: "Waiting", type: "waiting" };
};

const getDentistBranchOptions = async (dentistId, fallbackBookings = []) => {
  const { data, error } = await supabaseAdmin
    .from("dentist_schedule")
    .select("branch")
    .eq("dentist_id", dentistId)
    .eq("is_active", true);

  if (error) {
    const fromBookings = [...new Set((fallbackBookings || []).map((item) => item.branch).filter(Boolean))];
    return fromBookings;
  }

  const scheduleBranches = [...new Set((data || []).map((item) => item.branch).filter(Boolean))];
  if (scheduleBranches.length) return scheduleBranches;

  return [...new Set((fallbackBookings || []).map((item) => item.branch).filter(Boolean))];
};

export const getDentistDashboardSnapshot = async (dentistProfileId) => {
  const today = new Date();
  const todayIso = toIsoDate(today);

  const [dentistResult, todayBookingsResult, weeklyBookingsResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_list")
      .select("id, name, specialization, email")
      .eq("id", dentistProfileId)
      .single(),
    supabaseAdmin
      .from("bookings")
      .select("id, patient_name, branch, service, appointment_date, appointment_time, status, created_at, preassessment_id")
      .eq("dentist_id", dentistProfileId)
      .eq("appointment_date", todayIso)
      .order("appointment_time", { ascending: true }),
    supabaseAdmin
      .from("bookings")
      .select("appointment_date, status")
      .eq("dentist_id", dentistProfileId)
      .gte("appointment_date", toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)))
      .lte("appointment_date", todayIso),
  ]);

  if (dentistResult.error || !dentistResult.data) {
    return { success: false, statusCode: 404, message: "Dentist profile not found" };
  }

  if (todayBookingsResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load dashboard data" };
  }

  const todayBookings = (todayBookingsResult.data || []).filter((item) => normalize(item.status) !== "cancelled");
  const branchOptions = await getDentistBranchOptions(dentistProfileId, todayBookings);

  const queueOnly = todayBookings
    .filter((item) => ["confirmed", "in_progress", "in_treatment", "waiting"].includes(normalize(item.status)))
    .sort((a, b) => {
      const left = parseMinutes(a.appointment_time) ?? 0;
      const right = parseMinutes(b.appointment_time) ?? 0;
      return left - right;
    });

  const patients = queueOnly.map((booking, index) => {
    const mapped = mapPatientStatus(booking.status, index);
    return {
      id: booking.id,
      status: mapped.status,
      type: mapped.type,
      name: booking.patient_name || "Unknown Patient",
      time: toTimeLabel(booking.appointment_time),
      note: booking.service ? `Service: ${booking.service}` : "Dental appointment",
      branch: booking.branch || "-",
      appointmentDate: booking.appointment_date,
      preAssessment: null,
    };
  });

  const completedCount = todayBookings.filter((item) => normalize(item.status) === "completed").length;
  const waitingCount = todayBookings.filter((item) => ["confirmed", "waiting"].includes(normalize(item.status))).length;
  const inProgressCount = todayBookings.filter((item) => ["in_progress", "in_treatment"].includes(normalize(item.status))).length;
  const pendingPreAssessments = todayBookings.filter((item) => item.preassessment_id).length;

  const quickStats = [
    { title: "Appointments Completed", value: String(completedCount), note: "Today" },
    { title: "Patients Waiting", value: String(waitingCount), note: "Queue" },
    { title: "In Progress", value: String(inProgressCount), note: "Active now" },
    { title: "Top Service", value: todayBookings[0]?.service || "Dental Appointment", note: "Today" },
  ];

  const totalForPie = Math.max(1, completedCount + inProgressCount + waitingCount);
  const treatmentCompletion = [
    { label: "Completed", value: Math.round((completedCount / totalForPie) * 100) },
    { label: "In Progress", value: Math.round((inProgressCount / totalForPie) * 100) },
    { label: "Waiting", value: Math.round((waitingCount / totalForPie) * 100) },
  ];

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyMap = new Map();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    weeklyMap.set(toIsoDate(day), { day: weekdayLabels[day.getDay()], value: 0 });
  }

  for (const row of weeklyBookingsResult.data || []) {
    if (!weeklyMap.has(row.appointment_date)) continue;
    if (normalize(row.status) === "cancelled") continue;
    weeklyMap.get(row.appointment_date).value += 1;
  }

  const weeklyFlow = Array.from(weeklyMap.values());

  const notifications = queueOnly.slice(0, 6).map((item, index) => ({
    id: item.id || index + 1,
    title: normalize(item.status) === "confirmed" ? "New Appointment Request" : "Queue Update",
    message: `${item.patient_name || "Patient"} • ${item.service || "Dental Appointment"}`,
    time: toTimeLabel(item.appointment_time),
  }));

  return {
    success: true,
    statusCode: 200,
    data: {
      dentist: {
        id: dentistResult.data.id,
        name: dentistResult.data.name || "Dentist",
        specialization: dentistResult.data.specialization || "General Dentistry",
      },
      branchOptions,
      patients,
      quickStats,
      treatmentCompletion,
      weeklyFlow,
      summary: {
        totalClients: todayBookings.length,
        pendingPreAssessments,
      },
      notifications,
    },
  };
};
