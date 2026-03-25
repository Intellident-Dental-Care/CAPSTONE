import { supabaseAdmin } from "../../shared/supabaseClient.js";

const STATUS_MAP = {
  pending: "In Queue",
  waiting: "In Queue",
  in_queue: "In Queue",
  in_treatment: "In Treatment",
  inqueue: "In Queue",
  inqueue_: "In Queue",
  inqueue__: "In Queue",
  intreatment: "In Treatment",
  in_treatment_: "In Treatment",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TO_DB = {
  waiting: "pending",
  pending: "pending",
  "in queue": "confirmed",
  in_queue: "confirmed",
  confirmed: "confirmed",
  "in treatment": "in_treatment",
  in_treatment: "in_treatment",
  completed: "completed",
  cancelled: "cancelled",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeStatus = (status) => {
  if (!status) return "Waiting";
  const key = String(status).trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key] || String(status);
};

const toManilaNowParts = () => {
  const now = new Date();
  const dateText = now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const timeText = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Manila",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    date: dateText,
    time24: timeText,
  };
};

const normalizeBookingType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "walk-in" || normalized === "walkin") return "Walk-in";
  return "Online";
};

const isMissingBookingTypeColumnError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("booking_type") && message.includes("column");
};

const toDayOfWeekInManila = () => {
  const now = new Date();
  const weekday = now.toLocaleString("en-US", { timeZone: "Asia/Manila", weekday: "short" });
  const map = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? now.getDay();
};

const formatTime = (timeValue) => {
  if (!timeValue) return "-";
  const text = String(timeValue);
  const raw = text.includes("T") ? text.split("T")[1] : text;
  const [hourText = "0", minuteText = "00"] = raw.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${suffix}`;
};

export const listAppointments = async () => {
  let { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, patient_name, dentist_id, branch, service, appointment_date, appointment_time, booking_type, status, created_at")
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error && isMissingBookingTypeColumnError(error)) {
    const fallback = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, dentist_id, branch, service, appointment_date, appointment_time, status, created_at")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    bookings = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to load appointments" };
  }

  const dentistIds = [...new Set((bookings || []).map((row) => row.dentist_id).filter(Boolean))];
  const userIds = [...new Set((bookings || []).map((row) => row.user_id).filter(Boolean))];

  const [dentistsResult, usersResult] = await Promise.all([
    dentistIds.length
      ? supabaseAdmin
          .from("dentist_list")
          .select("id, name")
          .in("id", dentistIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabaseAdmin
          .from("users")
          .select("id, full_name, mobile, dob, email")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const dentistById = new Map((dentistsResult.data || []).map((d) => [d.id, d]));
  const userById = new Map((usersResult.data || []).map((u) => [u.id, u]));

  const mapped = (bookings || []).map((row) => {
    const user = userById.get(row.user_id) || {};
    const dentist = dentistById.get(row.dentist_id) || {};
    const status = normalizeStatus(row.status);
    const note = status === "Cancelled" ? "Cancelled due to not showing up" : "";

    return {
      id: row.id,
      userId: row.user_id,
      patientName: row.patient_name || user.full_name || "Unknown Patient",
      gender: "-",
      age: 0,
      dentist: dentist.name || "Unassigned Dentist",
      branch: row.branch || "-",
      treatment: row.service || "Dental Appointment",
      date: row.appointment_date,
      time: formatTime(row.appointment_time),
      type: normalizeBookingType(row.booking_type),
      status,
      notes: note,
      contact: user.mobile || "",
      email: user.email || "",
      dob: user.dob || "",
      createdAt: row.created_at,
    };
  });

  return { success: true, statusCode: 200, data: mapped };
};

export const updateAppointmentStatus = async (bookingId, status) => {
  const normalizedInput = normalizeText(status).replace(/\s+/g, " ");
  const dbStatus = STATUS_TO_DB[normalizedInput];

  if (!dbStatus) {
    return { success: false, statusCode: 400, message: "Invalid status" };
  }

  if (dbStatus === "in_treatment") {
    const now = toManilaNowParts();
    const { data: booking, error: bookingLookupError } = await supabaseAdmin
      .from("bookings")
      .select("id, appointment_date")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingLookupError || !booking) {
      return { success: false, statusCode: 404, message: "Booking not found" };
    }

    if (String(booking.appointment_date || "") !== String(now.date || "")) {
      return {
        success: false,
        statusCode: 400,
        message: "Only today appointments can be marked as In Treatment",
      };
    }
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status: dbStatus })
    .eq("id", bookingId);

  if (error) {
    const errorMessage = error?.message || "Unknown database error";
    return { success: false, statusCode: 500, message: `Failed to update appointment status: ${errorMessage}` };
  }

  return { success: true, statusCode: 200, message: "Appointment status updated" };
};

export const createWalkInAppointment = async (payload) => {
  const now = toManilaNowParts();

  if (!payload?.dentistId) {
    return {
      success: false,
      statusCode: 400,
      message: "Dentist is required",
    };
  }

  const dayOfWeek = toDayOfWeekInManila();
  const normalizedBranch = normalizeText(payload.branch);

  const { data: dentistSchedule, error: dentistScheduleError } = await supabaseAdmin
    .from("dentist_schedule")
    .select("id, branch, day_of_week, is_active")
    .eq("dentist_id", payload.dentistId)
    .eq("is_active", true)
    .eq("day_of_week", dayOfWeek);

  if (dentistScheduleError) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to validate dentist schedule",
    };
  }

  const hasBranchScheduleToday = (dentistSchedule || []).some(
    (item) => normalizeText(item.branch) === normalizedBranch
  );

  if (!hasBranchScheduleToday) {
    return {
      success: false,
      statusCode: 400,
      message: "Selected dentist has no active schedule today for this branch",
    };
  }

  const row = {
    user_id: payload.userId || null,
    patient_name: payload.patientName,
    dentist_id: payload.dentistId || null,
    branch: payload.branch,
    service: payload.service || null,
    appointment_date: now.date,
    appointment_time: now.time24,
    booking_type: "Walk-in",
    status: "pending",
  };

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (isMissingBookingTypeColumnError(error)) {
      return {
        success: false,
        statusCode: 400,
        message: "Missing bookings.booking_type column. Apply the SQL migration first.",
      };
    }

    return { success: false, statusCode: 500, message: "Failed to create walk-in appointment" };
  }

  return {
    success: true,
    statusCode: 201,
    message: "Walk-in appointment created",
    data: {
      id: data?.id,
      bookingType: "Walk-in",
      appointmentDate: now.date,
      appointmentTime24: now.time24,
      appointmentTimeLabel: formatTime(now.time24),
    },
  };
};
