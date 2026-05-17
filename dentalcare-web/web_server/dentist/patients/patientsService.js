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
  return date.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" });
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

// FOOLPROOF PHOTO EXTRACTOR FOR HISTORY TAB
const extractPhotos = (row) => {
  const urls = new Set();
  const rowStr = JSON.stringify(row || {});
  const matches = rowStr.match(/https?:\/\/[^"\\'\s\]\}]+/g);
  if (matches) {
    matches.forEach(m => {
      if (m.includes("patient-images")) urls.add(m);
    });
  }
  return Array.from(urls);
};

const toPreAssessmentPayload = (row, fallbackService, questionnaireLookup = new Map()) => {
  if (!row) return null;
  let answers = null;
  try {
    answers = typeof row.answers === "string" ? JSON.parse(row.answers) : row.answers;
  } catch (e) {
    answers = row.answers;
  }

  let questions = [];
  if (Array.isArray(answers)) {
    questions = answers.map((entry, index) => {
      const qKey = entry.questionId ?? entry.question_id ?? (index + 1);
      return {
        question: resolveQuestionText(qKey, questionnaireLookup),
        answer: String(entry?.answer || entry?.value || ""),
      };
    });
  } else if (answers && typeof answers === "object") {
    questions = Object.entries(answers)
      .filter(([k]) => !["uploadedPhotos", "photos", "tooth", "suggestedTreatment", "suggestedPrice"].includes(k))
      .map(([k, v]) => ({
        question: resolveQuestionText(k, questionnaireLookup),
        answer: String(typeof v === "object" ? (v?.answer || v?.value || "") : v ?? ""),
      }));
  }

  const rawPhotos = extractPhotos(row);
  const securePaths = [];
  for (const url of rawPhotos) {
    const pathMatch = url.match(/patient-images\/(.*)/);
    if (pathMatch && pathMatch[1]) securePaths.push(pathMatch[1]);
  }

  const selectedTooth = String(row.tooth_selected || answers?.tooth || "").trim();

  return {
    tooth: selectedTooth || "Not specified",
    uploadedPhotos: securePaths,
    questions,
    suggestedTreatment: String(row.ai_service || answers?.suggestedTreatment || fallbackService || "").trim() || "Consultation",
    suggestedPrice: answers?.suggestedPrice || "-",
    description: String(row.description || "").trim() || "No description provided."
  };
};

export const getDentistPatientHistory = async (dentistProfileId) => {
  const [bookingsResult, usersResult, dentistResult, proceduresResult, profilesResult] = await Promise.all([
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
    supabaseAdmin
      .from("user_profiles")
      .select("id, user_id, name, email"),
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
    // ADDED columns needed for accurate parsing
    const preassessmentResult = await supabaseAdmin
      .from("patient_preassessment")
      .select("id, answers, description, tooth_selected, uploaded_images, ai_service")
      .in("id", preassessmentIds);
    if (!preassessmentResult.error) {
      preassessmentById = new Map((preassessmentResult.data || []).map((row) => [row.id, row]));
    }
  }

  const preAssessmentsByBookingId = new Map();
  for (const booking of bookingsResult.data || []) {
    if (booking.preassessment_id && preassessmentById.has(booking.preassessment_id)) {
      preAssessmentsByBookingId.set(
        booking.id,
        toPreAssessmentPayload(preassessmentById.get(booking.preassessment_id), booking.service, questionnaireLookup)
      );
    }
  }

  // --- SEPARATE PROFILES LOGIC ---
  const profilesByUser = new Map();
  for (const profile of profilesResult.data || []) {
    if (!profile?.user_id) continue;
    const list = profilesByUser.get(profile.user_id) || [];
    list.push(profile);
    profilesByUser.set(profile.user_id, list);
  }

  const grouped = new Map();

  for (const booking of bookingsResult.data || []) {
    if (normalize(booking.status) === "cancelled") continue;

    const user = booking.user_id ? userById.get(booking.user_id) : null;
    const bookingPatientName = String(booking.patient_name || "").trim();
    const userProfiles = user ? (profilesByUser.get(user.id) || []) : [];
    
    // Attempt to match the booking name to a specific sub-profile, otherwise default to main user
    const matchedProfile = userProfiles.find((p) => normalize(p.name) === normalize(bookingPatientName)) || null;
    const resolvedName = matchedProfile?.name || bookingPatientName || user?.full_name || "Unknown Patient";
    
    // Group key is now UserID + Specific Profile Name (This separates Edward from Anak)
    const groupKey = booking.user_id ? `${booking.user_id}::${normalize(resolvedName)}` : `Guest::${normalize(resolvedName)}`;

    const current = grouped.get(groupKey) || {
      id: groupKey,
      patientId: booking.user_id || null, // This is the UUID of the main account
      profileName: resolvedName,          // This is "Edward" or "Anak"
      name: resolvedName,
      gender: "-",
      age: user ? computeAge(user.dob) : 0,
      phone: user?.mobile || "",
      branch: booking.branch || "-",
      dateOfVisit: booking.appointment_date,
      currentDentalRecordLabel: "Current Dental Record",
      procedures: [],
    };

    current.dateOfVisit = current.dateOfVisit && String(current.dateOfVisit) > String(booking.appointment_date)
      ? current.dateOfVisit
      : booking.appointment_date;

    const paPayload = preAssessmentsByBookingId.get(booking.id) || null;

    current.procedures.push({
      id: `booking-${booking.id}`,
      date: formatProcedureDate(booking.appointment_date, booking.appointment_time),
      procedure: booking.service || "Dental Appointment",
      tooth: paPayload?.tooth || "Not specified", // FIX: Replaced hardcoded "Not specified"
      dentist: dentistName,
      remarks: `Status: ${booking.status || "scheduled"}`,
      beforePhoto: null,
      afterPhoto: null,
      source: "booking",
      bookingId: booking.id,
      preAssessment: paPayload,
    });

    grouped.set(groupKey, current);
  }

  if (!proceduresResult.error) {
    for (const procedure of proceduresResult.data || []) {
      // Find the booking this procedure belongs to, so we know WHICH profile it was for
      const originalBooking = (bookingsResult.data || []).find(b => b.id === procedure.booking_id);
      
      let groupKey = null;
      if (originalBooking) {
        const resolvedName = originalBooking.patient_name || userById.get(originalBooking.user_id)?.full_name || "Unknown Patient";
        groupKey = originalBooking.user_id ? `${originalBooking.user_id}::${normalize(resolvedName)}` : `Guest::${normalize(resolvedName)}`;
      } else {
        // Fallback if procedure has no booking attached
        const user = userById.get(procedure.patient_id);
        groupKey = procedure.patient_id ? `${procedure.patient_id}::${normalize(user?.full_name || "Unknown")}` : null;
      }

      if (!groupKey || !grouped.has(groupKey)) continue;

      const current = grouped.get(groupKey);
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
        preAssessment: procedure.booking_id ? (preAssessmentsByBookingId.get(procedure.booking_id) || null) : null,
      });
      grouped.set(groupKey, current);
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
  const patientId = String(payload.patientId || "").trim(); // This is the MAIN user UUID
  const bookingId = payload.bookingId ? String(payload.bookingId).trim() : null;
  const procedureName = String(payload.procedure || payload.service || "").trim();
  const remarks = String(payload.remarks || "").trim();
  const toothRaw = String(payload.tooth || "").trim();
  const tooth = !toothRaw || toothRaw.toLowerCase() === "not specified" ? null : toothRaw;

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
    before_image_url: null,
    after_image_url: null,
  };

  const { data, error } = await supabaseAdmin
    .from("patient_procedures")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to save procedure", error: error.message };
  }

  return { success: true, statusCode: 201, message: "Procedure saved successfully", data: { id: data?.id } };
};