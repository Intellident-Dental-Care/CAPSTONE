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
  return text || "Consultation";
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

// 12-hour time formatter helper (with added safety checks)
const formatTime12Hour = (timeString) => {
  if (!timeString) return "N/A";
  
  // Safety check just in case the database returns a full timestamp instead of just time
  const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
  const parts = timePart.split(':');
  
  if (parts.length < 2) return timeString; 

  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  
  if (isNaN(hour)) return timeString;
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12;
  hour = hour ? hour : 12; 
  
  return `${hour}:${minute} ${ampm}`;
};

export const getPatientsList = async () => {
  try {
    const [usersResult, bookingsResult, dentistsResult, profilesResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        // Swapped is_verified for is_active here
        .select("id, full_name, email, mobile, dob, created_at, is_active"),
      supabaseAdmin
        .from("bookings")
        .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status, dentist_id")
        .order("appointment_date", { ascending: false }),
      supabaseAdmin
        .from("dentist_list")
        .select("id, name"),
      supabaseAdmin
        .from("user_profiles")
        .select("id, user_id, name, email, is_active")
    ]);

    if (usersResult.error) throw usersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;

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

    const ensurePatientEntry = (user, profileName, profileId = null, profileEmail = "", isProfileActive = null) => {
      const normalizedProfileName = normalizeText(profileName) || "main";
      const profileKey = `${user.id}::${normalizedProfileName}`;

      if (!groupedPatients.has(profileKey)) {
        // Now accurately outputs Active or Inactive based on the boolean
        let patientStatus = "Inactive";
        if (profileId) {
            patientStatus = isProfileActive ? "Active" : "Inactive";
        } else {
            patientStatus = user.is_active ? "Active" : "Inactive";
        }

        groupedPatients.set(profileKey, {
          id: profileKey, 
          accountId: user.id,
          profileId,
          name: profileName || user.full_name || "Unknown Patient",
          gender: "Not Specified",
          age: computeAge(user.dob),
          phone: user.mobile || "N/A",
          visitDate: user.created_at, 
          email: profileEmail || user.email || "N/A",
          birthday: user.dob || "N/A",
          address: "N/A",
          branch: "N/A",
          status: patientStatus,
          service: "N/A",
          procedures: [],
        });
      }

      return profileKey;
    };

    for (const user of usersResult.data || []) {
      const userProfiles = profilesByUser.get(user.id) || [];

      if (userProfiles.length > 0) {
        for (const profile of userProfiles) {
          ensurePatientEntry(user, profile.name, profile.id, profile.email, profile.is_active);
        }
      } else {
        ensurePatientEntry(user, user.full_name, null, user.email, null);
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
      const profileKey = ensurePatientEntry(user, profileName, matchedProfile?.id || null, matchedProfile?.email || "", matchedProfile?.is_active);
      const current = groupedPatients.get(profileKey);

      // Ensure the visitDate updates to the most recent booking
      if (current.visitDate === user.created_at || String(current.visitDate) < String(booking.appointment_date)) {
        current.visitDate = booking.appointment_date;
      }
        
      current.service = toServiceName(booking.service);
      current.branch = booking.branch || current.branch;

      current.procedures.push({
        name: toServiceName(booking.service),
        date: booking.appointment_date,
        time: formatTime12Hour(booking.appointment_time), // Formatting applied
        doctor: dentistById.get(booking.dentist_id) || "Unassigned",
        status: statusMap(booking.status),
      });

      groupedPatients.set(profileKey, current);
    }

    const mapped = Array.from(groupedPatients.values());

    return { success: true, statusCode: 200, data: mapped };
  } catch (error) {
    console.error("Super Admin Patient Service Error:", error);
    return { success: false, statusCode: 500, message: "Internal Server Error" };
  }
};