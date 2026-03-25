import { supabaseAdmin } from "../../shared/supabaseClient.js";

const statusMap = (value) => {
  const key = String(value || "").toLowerCase();
  if (key === "completed") return "Completed";
  if (key === "cancelled") return "Cancelled";
  if (key === "in_queue") return "In Queue";
  return "Waiting";
};

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

export const listPatients = async () => {
  const [usersResult, bookingsResult, dentistsResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, full_name, email, mobile, dob, created_at"),
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, appointment_date, appointment_time, status, dentist_id")
      .order("appointment_date", { ascending: false }),
    supabaseAdmin
      .from("dentist_list")
      .select("id, name"),
  ]);

  if (usersResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load patients" };
  }

  const dentistById = new Map((dentistsResult.data || []).map((item) => [item.id, item.name]));
  const bookingsByUser = new Map();

  for (const booking of bookingsResult.data || []) {
    if (!booking.user_id) continue;
    const list = bookingsByUser.get(booking.user_id) || [];
    list.push(booking);
    bookingsByUser.set(booking.user_id, list);
  }

  const mapped = (usersResult.data || []).map((user) => {
    const history = bookingsByUser.get(user.id) || [];
    const latest = history[0] || null;

    return {
      id: user.id,
      name: user.full_name || latest?.patient_name || "Unknown Patient",
      gender: "-",
      age: computeAge(user.dob),
      phone: user.mobile || "",
      visitDate: latest?.appointment_date || user.created_at,
      email: user.email || "",
      birthday: user.dob || "",
      address: "-",
      branch: latest?.branch || "-",
      status: statusMap(latest?.status),
      service: "Dental Appointment",
      procedures: history.map((item) => ({
        name: "Dental Appointment",
        date: item.appointment_date,
        time: item.appointment_time,
        doctor: dentistById.get(item.dentist_id) || "Unassigned Dentist",
        status: statusMap(item.status),
      })),
    };
  });

  return { success: true, statusCode: 200, data: mapped };
};
