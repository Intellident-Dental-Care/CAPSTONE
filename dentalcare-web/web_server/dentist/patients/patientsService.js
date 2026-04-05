import { supabaseAdmin } from "../../shared/supabaseClient.js";

const normalize = (value) => String(value || "").trim().toLowerCase();
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));

const computeAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
};

const formatVisitDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatProcedureDate = (dateValue, timeValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  const dateText = Number.isNaN(date.getTime())
    ? String(dateValue)
    : date.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" });

  if (!timeValue) {
    if (typeof dateValue === "string" && dateValue.includes("T") && !Number.isNaN(date.getTime())) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const suffix = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${dateText} ${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
    }
    return dateText;
  }

  const [h = "0", m = "00"] = String(timeValue).split(":");
  const hour = Number.parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${dateText} ${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
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

export const getDentistPatientHistory = async (dentistProfileId) => {
  const [bookingsResult, usersResult, dentistResult, proceduresResult] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status, preassessment_id")
      .eq("dentist_id", dentistProfileId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false }),
    supabaseAdmin
      .from("users")
      .select("id, full_name, mobile, dob"),
    supabaseAdmin
      .from("dentist_list")
      .select("name")
      .eq("id", dentistProfileId)
      .maybeSingle(),
    supabaseAdmin
      .from("patient_procedures")
      .select("id, patient_id, booking_id, tooth, procedure_name, remarks, before_image_url, after_image_url, created_at, updated_at")
      .eq("dentist_id", dentistProfileId)
      .order("created_at", { ascending: false }),
  ]);

  if (bookingsResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load patient history" };
  }

  const userById = new Map((usersResult.data || []).map((item) => [item.id, item]));
  const dentistName = dentistResult.data?.name || "Assigned Dentist";

  let questionnaireLookup = new Map();
  const questionnaireResult = await supabaseAdmin
    .from("questionnaire")
    .select("id, question_text, question_order")
    .eq("is_active", true)
    .order("question_order", { ascending: true });

  if (!questionnaireResult.error) {
    for (const row of questionnaireResult.data || []) {
      questionnaireLookup.set(String(row.id), row.question_text);
      questionnaireLookup.set(String(row.question_order), row.question_text);
      questionnaireLookup.set(String((row.question_order || 1) - 1), row.question_text);
    }
  }

  const preassessmentIds = [...new Set((bookingsResult.data || []).map((item) => item.preassessment_id).filter(Boolean))];
  let preassessmentById = new Map();

  if (preassessmentIds.length) {
    const preassessmentResult = await supabaseAdmin
      .from("patient_preassessment")
      .select("id, answers, description")
      .in("id", preassessmentIds);

    if (!preassessmentResult.error) {
      preassessmentById = new Map((preassessmentResult.data || []).map((row) => [row.id, row]));
    }
  }

  // --- NEW: Create a specific map of Booking ID -> PreAssessment Payload ---
  const preAssessmentsByBookingId = new Map();
  for (const booking of bookingsResult.data || []) {
    if (booking.preassessment_id && preassessmentById.has(booking.preassessment_id)) {
      preAssessmentsByBookingId.set(
        booking.id,
        toPreAssessmentPayload(
          preassessmentById.get(booking.preassessment_id),
          booking.service,
          questionnaireLookup
        )
      );
    }
  }

  const grouped = new Map();

  for (const booking of bookingsResult.data || []) {
    if (normalize(booking.status) === "cancelled") continue;

    const groupKey = booking.user_id || `${booking.patient_name || "Unknown"}::${booking.branch || ""}`;
    const current = grouped.get(groupKey) || {
      id: groupKey,
      patientId: booking.user_id || null,
      name: booking.patient_name || "Unknown Patient",
      gender: "-",
      age: 0,
      phone: "",
      branch: booking.branch || "-",
      dateOfVisit: booking.appointment_date,
      currentDentalRecordLabel: "Current Dental Record",
      procedures: [],
    };

    const user = booking.user_id ? userById.get(booking.user_id) : null;
    if (user) {
      if (!current.name || current.name === "Unknown Patient") {
        current.name = user.full_name || current.name;
      }
      current.phone = user.mobile || current.phone;
      current.age = computeAge(user.dob);
    }

    current.dateOfVisit = current.dateOfVisit && String(current.dateOfVisit) > String(booking.appointment_date)
      ? current.dateOfVisit
      : booking.appointment_date;

    current.procedures.push({
      id: `booking-${booking.id}`,
      date: formatProcedureDate(booking.appointment_date, booking.appointment_time),
      procedure: booking.service || "Dental Appointment",
      tooth: "Not specified",
      dentist: dentistName,
      remarks: `Status: ${booking.status || "scheduled"}`,
      beforePhoto: null,
      afterPhoto: null,
      source: "booking",
      bookingId: booking.id,
      // Pass the specific pre-assessment for this booking directly to the procedure
      preAssessment: preAssessmentsByBookingId.get(booking.id) || null,
    });

    grouped.set(groupKey, current);
  }

  if (!proceduresResult.error) {
    for (const procedure of proceduresResult.data || []) {
      const patientKey = procedure.patient_id && grouped.has(procedure.patient_id)
        ? procedure.patient_id
        : null;

      if (!patientKey) continue;

      const current = grouped.get(patientKey);
      current.procedures.unshift({
        id: `procedure-${procedure.id}`,
        date: formatProcedureDate(procedure.updated_at || procedure.created_at, null),
        procedure: procedure.procedure_name || "Procedure",
        tooth: procedure.tooth || "Not specified",
        dentist: dentistName,
        remarks: procedure.remarks || "-",
        beforePhoto: procedure.before_image_url || null,
        afterPhoto: procedure.after_image_url || null,
        source: "procedure",
        bookingId: procedure.booking_id || null,
        // Match the procedure to its original booking's pre-assessment, if it exists
        preAssessment: procedure.booking_id ? (preAssessmentsByBookingId.get(procedure.booking_id) || null) : null,
      });
      grouped.set(patientKey, current);
    }
  }

  const patients = Array.from(grouped.values()).map((item, index) => ({
    ...item,
    id: item.id || index + 1,
    dateOfVisit: formatVisitDate(item.dateOfVisit),
  }));

  return {
    success: true,
    statusCode: 200,
    data: {
      patients,
      branches: [...new Set(patients.map((item) => item.branch).filter(Boolean))],
      notifications: [],
    },
  };
};

export const createDentistProcedure = async (dentistProfileId, payload = {}) => {
  const patientId = String(payload.patientId || "").trim();
  const bookingId = payload.bookingId ? String(payload.bookingId).trim() : null;
  const procedureName = String(payload.procedure || payload.service || "").trim();
  const remarks = String(payload.remarks || "").trim();
  const toothRaw = String(payload.tooth || "").trim();
  const tooth = !toothRaw || toothRaw.toLowerCase() === "not specified" ? null : toothRaw;

  const beforeImageUrl =
    typeof payload.beforeImageUrl === "string" && payload.beforeImageUrl.startsWith("http")
      ? payload.beforeImageUrl
      : null;
  const afterImageUrl =
    typeof payload.afterImageUrl === "string" && payload.afterImageUrl.startsWith("http")
      ? payload.afterImageUrl
      : null;

  if (!isUuid(patientId)) {
    return { success: false, statusCode: 400, message: "Valid patient UUID is required" };
  }

  if (!procedureName) {
    return { success: false, statusCode: 400, message: "Procedure is required" };
  }

  const row = {
    patient_id: patientId,
    dentist_id: dentistProfileId,
    booking_id: isUuid(bookingId) ? bookingId : null,
    tooth,
    procedure_name: procedureName,
    remarks: remarks || null,
    before_image_url: beforeImageUrl,
    after_image_url: afterImageUrl,
  };

  const { data, error } = await supabaseAdmin
    .from("patient_procedures")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to save procedure", error: error.message };
  }

  return {
    success: true,
    statusCode: 201,
    message: "Procedure saved successfully",
    data: {
      id: data?.id,
    },
  };
};