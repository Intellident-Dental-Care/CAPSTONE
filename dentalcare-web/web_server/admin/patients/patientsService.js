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

const toServiceName = (value) => {
  const text = String(value || "").trim();
  return text || "Dental Appointment";
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

export const listPatients = async () => {
  const [usersResult, bookingsResult, dentistsResult, profilesResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, full_name, email, mobile, dob, created_at"),
    supabaseAdmin
      .from("bookings")
      .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status, dentist_id")
      .order("appointment_date", { ascending: false }),
    supabaseAdmin
      .from("dentist_list")
      .select("id, name"),
    supabaseAdmin
      .from("user_profiles")
      .select("id, user_id, name, email"),
  ]);

  if (usersResult.error) {
    return { success: false, statusCode: 500, message: "Failed to load patients" };
  }

  const dentistById = new Map((dentistsResult.data || []).map((item) => [item.id, item.name]));
  const userById = new Map((usersResult.data || []).map((item) => [item.id, item]));
  const profilesByUser = new Map();
  const groupedPatients = new Map();

  for (const profile of profilesResult.data || []) {
    if (!profile?.user_id) continue;
    const list = profilesByUser.get(profile.user_id) || [];
    list.push(profile);
    profilesByUser.set(profile.user_id, list);
  }

  const ensurePatientEntry = (user, profileName, profileId = null, profileEmail = "") => {
    const normalizedProfileName = normalizeText(profileName) || "main";
    const profileKey = `${user.id}::${normalizedProfileName}`;

    if (!groupedPatients.has(profileKey)) {
      groupedPatients.set(profileKey, {
        id: profileKey,
        accountId: user.id,
        profileId,
        profileName: profileName || user.full_name || "Unknown Patient",
        accountName: user.full_name || "Main Account",
        accountEmail: user.email || profileEmail || "",
        gender: "-",
        age: computeAge(user.dob),
        phone: user.mobile || "",
        visitDate: user.created_at,
        email: user.email || profileEmail || "",
        birthday: user.dob || "",
        address: "-",
        branch: "-",
        status: "Active",
        service: "-",
        procedures: [],
      });
    }

    return profileKey;
  };

  for (const user of usersResult.data || []) {
    const userProfiles = profilesByUser.get(user.id) || [];

    if (userProfiles.length > 0) {
      for (const profile of userProfiles) {
        ensurePatientEntry(user, profile.name, profile.id, profile.email);
      }
    } else {
      ensurePatientEntry(user, user.full_name, null, user.email);
    }
  }

  for (const booking of bookingsResult.data || []) {
    if (!booking.user_id) continue;
    const user = userById.get(booking.user_id) || null;
    if (!user) continue;

    const userProfiles = profilesByUser.get(booking.user_id) || [];
    const bookingPatientName = String(booking.patient_name || "").trim();
    const matchedProfile = userProfiles.find(
      (profile) => normalizeText(profile.name) === normalizeText(bookingPatientName)
    ) || null;

    const profileName = bookingPatientName || matchedProfile?.name || user.full_name;
    const profileKey = ensurePatientEntry(user, profileName, matchedProfile?.id || null, matchedProfile?.email || "");
    const current = groupedPatients.get(profileKey);

    current.visitDate = current.visitDate && String(current.visitDate) > String(booking.appointment_date)
      ? current.visitDate
      : booking.appointment_date;
    current.service = toServiceName(booking.service);
    current.branch = booking.branch || current.branch;

    current.procedures.push({
      name: toServiceName(booking.service),
      date: booking.appointment_date,
      time: booking.appointment_time,
      doctor: dentistById.get(booking.dentist_id) || "Unassigned Dentist",
      status: statusMap(booking.status),
    });

    groupedPatients.set(profileKey, current);
  }

  const mapped = Array.from(groupedPatients.values()).map((item) => ({
    ...item,
    name: item.profileName,
  }));

  return { success: true, statusCode: 200, data: mapped };
};
