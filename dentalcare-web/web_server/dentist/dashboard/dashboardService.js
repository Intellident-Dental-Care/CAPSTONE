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

const resolveQuestionText = (rawKey, questionnaireLookup) => {
  const key = String(rawKey ?? "").trim();
  if (!key) return key;

  if (questionnaireLookup.has(key)) return questionnaireLookup.get(key);

  const numericKey = Number(key);
  if (!Number.isNaN(numericKey)) {
    const plusOneKey = String(numericKey + 1);
    if (questionnaireLookup.has(plusOneKey)) return questionnaireLookup.get(plusOneKey);
  }

  return key;
};

const toPreAssessmentPayload = (row, fallbackService, questionnaireLookup = new Map()) => {
  if (!row) return null;

  const answers = row.answers && typeof row.answers === "object" ? row.answers : null;

  const questions = Array.isArray(answers)
    ? answers.map((entry, index) => ({
        question: entry?.question || `Question ${index + 1}`,
        answer: entry?.answer || entry?.value || String(entry || ""),
      }))
    : answers && typeof answers === "object"
      ? Object.entries(answers)
          .filter(([key]) => !["uploadedPhotos", "photos", "tooth", "suggestedTreatment", "suggestedPrice"].includes(key))
          .map(([key, value]) => ({
            question: resolveQuestionText(key, questionnaireLookup),
            answer: String(value ?? ""),
          }))
      : [];

  const uploadedPhotos = Array.isArray(answers?.uploadedPhotos)
    ? answers.uploadedPhotos
    : Array.isArray(answers?.photos)
      ? answers.photos
      : [];

  return {
    tooth: answers?.tooth || "Not specified",
    uploadedPhotos,
    questions,
    suggestedTreatment: row.description || answers?.suggestedTreatment || fallbackService || "Dental Appointment",
    suggestedPrice: answers?.suggestedPrice || "-",
  };
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

  const [dentistResult, todayBookingsResult, weeklyBookingsResult, allBookingsResult] = await Promise.all([
    supabaseAdmin
      .from("dentist_list")
      .select("id, name, specialization, email")
      .eq("id", dentistProfileId)
      .single(),
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status, created_at, preassessment_id")
      .eq("dentist_id", dentistProfileId)
      .eq("appointment_date", todayIso)
      .order("appointment_time", { ascending: true }),
    supabaseAdmin
      .from("bookings")
      .select("appointment_date, status")
      .eq("dentist_id", dentistProfileId)
      .gte("appointment_date", toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)))
      .lte("appointment_date", todayIso),
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status, created_at, preassessment_id")
      .eq("dentist_id", dentistProfileId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false }),
  ]);

  if (dentistResult.error || !dentistResult.data) {
    return { success: false, statusCode: 404, message: "Dentist profile not found" };
  }

  if (todayBookingsResult.error || allBookingsResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load dashboard data" };
  }

  const todayBookings = (todayBookingsResult.data || []).filter((item) => normalize(item.status) !== "cancelled");
  const allBookings = (allBookingsResult.data || []).filter((item) => normalize(item.status) !== "cancelled");
  const branchOptions = await getDentistBranchOptions(dentistProfileId, allBookings);

  const preassessmentIds = [...new Set(allBookings.map((item) => item.preassessment_id).filter(Boolean))];
  let preassessmentById = new Map();
  let questionnaireLookup = new Map();

  const questionnaireResult = await supabaseAdmin
    .from("questionnaire")
    .select("id, question_text, question_order")
    .eq("is_active", true)
    .order("question_order", { ascending: true });

  if (!questionnaireResult.error) {
    questionnaireLookup = new Map();
    for (const row of questionnaireResult.data || []) {
      questionnaireLookup.set(String(row.id), row.question_text);
      questionnaireLookup.set(String(row.question_order), row.question_text);
      questionnaireLookup.set(String((row.question_order || 1) - 1), row.question_text);
    }
  }

  if (preassessmentIds.length) {
    const preassessmentResult = await supabaseAdmin
      .from("patient_preassessment")
      .select("id, answers, description")
      .in("id", preassessmentIds);

    if (!preassessmentResult.error) {
      preassessmentById = new Map((preassessmentResult.data || []).map((row) => [row.id, row]));
    }
  }

  const queueOnly = allBookings
    .sort((a, b) => {
      const leftDate = new Date(`${a.appointment_date || "1970-01-01"}T${a.appointment_time || "00:00"}`);
      const rightDate = new Date(`${b.appointment_date || "1970-01-01"}T${b.appointment_time || "00:00"}`);
      return rightDate - leftDate;
    });

  const patients = queueOnly.map((booking, index) => {
    const mapped = mapPatientStatus(booking.status, index);
    return {
      id: booking.id,
      bookingId: booking.id,
      patientId: booking.user_id || null,
      status: mapped.status,
      type: mapped.type,
      name: booking.patient_name || "Unknown Patient",
      time: toTimeLabel(booking.appointment_time),
      note: booking.service ? `Service: ${booking.service}` : "Dental appointment",
      branch: booking.branch || "-",
      appointmentDate: booking.appointment_date,
      preAssessment: toPreAssessmentPayload(
        preassessmentById.get(booking.preassessment_id),
        booking.service,
        questionnaireLookup
      ),
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
