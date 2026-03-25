import { supabaseAdmin } from "../../shared/supabaseClient.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

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

  if (!timeValue) return dateText;

  const [h = "0", m = "00"] = String(timeValue).split(":");
  const hour = Number.parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${dateText} ${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const getDentistPatientHistory = async (dentistProfileId) => {
  const [bookingsResult, usersResult, dentistResult] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status")
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
  ]);

  if (bookingsResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load patient history" };
  }

  const userById = new Map((usersResult.data || []).map((item) => [item.id, item]));
  const dentistName = dentistResult.data?.name || "Assigned Dentist";

  const grouped = new Map();

  for (const booking of bookingsResult.data || []) {
    if (normalize(booking.status) === "cancelled") continue;

    const groupKey = booking.user_id || `${booking.patient_name || "Unknown"}::${booking.branch || ""}`;
    const current = grouped.get(groupKey) || {
      id: groupKey,
      name: booking.patient_name || "Unknown Patient",
      gender: "-",
      age: 0,
      phone: "",
      branch: booking.branch || "-",
      dateOfVisit: booking.appointment_date,
      currentDentalRecordLabel: "Current Dental Record",
      preAssessment: null,
      procedures: [],
    };

    const user = booking.user_id ? userById.get(booking.user_id) : null;
    if (user) {
      current.name = user.full_name || current.name;
      current.phone = user.mobile || current.phone;
      current.age = computeAge(user.dob);
    }

    current.dateOfVisit = current.dateOfVisit && String(current.dateOfVisit) > String(booking.appointment_date)
      ? current.dateOfVisit
      : booking.appointment_date;

    current.procedures.push({
      id: booking.id,
      date: formatProcedureDate(booking.appointment_date, booking.appointment_time),
      procedure: booking.service || "Dental Appointment",
      tooth: "Not specified",
      dentist: dentistName,
      remarks: `Status: ${booking.status || "scheduled"}`,
      beforePhoto: null,
      afterPhoto: null,
    });

    grouped.set(groupKey, current);
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
