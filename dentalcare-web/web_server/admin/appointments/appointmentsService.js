import { supabaseAdmin } from "../../shared/supabaseClient.js";

const STATUS_MAP = {
  pending: "Pending",
  waiting: "Waiting",
  in_queue: "In Queue",
  inqueue: "In Queue",
  inqueue_: "In Queue",
  inqueue__: "In Queue",
  completed: "Completed",
  cancelled: "Cancelled",
};

const normalizeStatus = (status) => {
  if (!status) return "Waiting";
  const key = String(status).trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key] || String(status);
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
  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, patient_name, dentist_id, branch, service, appointment_date, appointment_time, status, created_at")
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

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
      type: "Online",
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
  const normalizedInput = String(status || "").trim().toLowerCase();
  const dbStatus = normalizedInput === "in queue" ? "in_queue" : normalizedInput || "waiting";

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: dbStatus })
    .eq("id", bookingId);

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to update appointment status" };
  }

  return { success: true, statusCode: 200, message: "Appointment status updated" };
};

export const createWalkInAppointment = async (payload) => {
  const row = {
    user_id: payload.userId || null,
    patient_name: payload.patientName,
    dentist_id: payload.dentistId || null,
    branch: payload.branch,
    service: payload.service || null,
    appointment_date: payload.date,
    appointment_time: payload.time24,
    status: "waiting",
  };

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to create walk-in appointment" };
  }

  return { success: true, statusCode: 201, message: "Walk-in appointment created", data };
};
