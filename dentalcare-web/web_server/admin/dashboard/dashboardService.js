import { supabaseAdmin } from "../../shared/supabaseClient.js";

const normalize = (value) => (value || "").toString().trim().toLowerCase();
const PIE_COLORS = ["#e8427d", "#ebb8cb", "#f4dbe6", "#f0a9c2"];

const mapStatus = (status) => {
  const normalized = normalize(status);
  if (normalized === "confirmed") return "In Queue";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled") return "Cancelled";
  return "Waiting";
};

const parseTime = (timeValue) => {
  if (!timeValue) return "";
  const parts = timeValue.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] || 0);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;
  return `${normalizedHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const formatRelativeTime = (value) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const monthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (monthIndex) => {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return labels[monthIndex] || "-";
};

const toStatusClass = (status) => (status === "On-Duty" ? "green" : "yellow");

const toServiceName = (booking) => {
  const value = booking?.service || booking?.treatment || booking?.procedure || booking?.service_name;
  return value ? String(value) : "Dental Appointment";
};

export const getAdminBranch = async (adminProfileId) => {
  const { data: admin, error } = await supabaseAdmin
    .from("admin_list")
    .select("id, branch, admin_type, full_name")
    .eq("id", adminProfileId)
    .single();

  if (error || !admin) {
    return null;
  }

  return admin;
};

export const getTodayBranchBookings = async (adminProfileId) => {
  const admin = await getAdminBranch(adminProfileId);

  if (!admin) {
    return { success: false, message: "Admin profile not found", statusCode: 404 };
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      patient_name,
      branch,
      service,
      appointment_date,
      appointment_time,
      status,
      created_at,
      preassessment_id,
      dentists:dentist_id (id, name)
    `)
    .eq("appointment_date", today)
    .order("appointment_time", { ascending: true });

  if (error) {
    return { success: false, message: "Failed to fetch bookings", statusCode: 500 };
  }

  const adminBranch = normalize(admin.branch);
  const filtered = (bookings || []).filter((row) => {
    return !adminBranch || normalize(row.branch) === adminBranch;
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      admin,
      date: today,
      bookings: filtered.map((row, index) => ({
        id: row.id,
        queueNumber: index + 1,
        patientName: row.patient_name,
        branch: row.branch,
        date: row.appointment_date,
        time: parseTime(row.appointment_time),
        status: mapStatus(row.status),
        rawStatus: row.status,
        procedure: toServiceName(row),
        dentist: row.dentists?.name || "Unassigned",
        createdAt: row.created_at,
        preassessmentId: row.preassessment_id,
      })),
    },
  };
};

const getBranchBookingsForYear = async (branch) => {
  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      patient_name,
      branch,
      service,
      appointment_date,
      appointment_time,
      status,
      created_at,
      preassessment_id,
      dentists:dentist_id (id, name)
    `)
    .gte("appointment_date", yearStart)
    .lte("appointment_date", yearEnd)
    .order("appointment_date", { ascending: true });

  if (error) {
    return { success: false, statusCode: 500, message: "Failed to fetch annual bookings" };
  }

  const normalizedBranch = normalize(branch);
  const filtered = (data || []).filter((row) => !normalizedBranch || normalize(row.branch) === normalizedBranch);

  return { success: true, data: filtered };
};

export const getDashboardSnapshot = async (adminProfileId) => {
  const queueResult = await getTodayBranchBookings(adminProfileId);

  if (!queueResult.success) {
    return queueResult;
  }

  const annualResult = await getBranchBookingsForYear(queueResult.data.admin.branch);
  if (!annualResult.success) {
    return annualResult;
  }

  const todayBookings = queueResult.data.bookings;
  const yearlyBookings = annualResult.data || [];

  const current = todayBookings.find((b) => b.status === "In Queue") || todayBookings[0] || null;
  const waiting = todayBookings.filter((b) => b.status === "Waiting");
  const completed = todayBookings.filter((b) => b.status === "Completed");
  const confirmed = todayBookings.filter((b) => normalize(b.rawStatus) === "confirmed").length;
  const walkins = todayBookings.filter((b) => !b.preassessmentId).length;

  const dentistCount = new Set(todayBookings.map((b) => b.dentist).filter((name) => name && name !== "Unassigned")).size;

  const attendingDentistsMap = new Map();
  for (const booking of todayBookings) {
    const key = booking.dentist || "Unassigned";
    if (key === "Unassigned") continue;
    const currentDentist = attendingDentistsMap.get(key) || { name: key, count: 0 };
    currentDentist.count += 1;
    attendingDentistsMap.set(key, currentDentist);
  }

  const attendingDentists = Array.from(attendingDentistsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((item, index) => ({
      id: index + 1,
      name: item.name,
      patients: `${item.count} Patient${item.count > 1 ? "s" : ""}`,
      status: "On-Duty",
      statusClass: toStatusClass("On-Duty"),
    }));

  const recentActivity = todayBookings
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6)
    .map((item, index) => {
      const status = normalize(item.rawStatus);
      let title = "New booking confirmed";
      let description = `${item.patientName} booked ${item.procedure}`;

      if (status === "confirmed") {
        title = "Patient checked in";
        description = `${item.patientName} is now in queue for ${item.procedure}`;
      } else if (status === "completed") {
        title = "Treatment completed";
        description = `${item.procedure} completed by ${item.dentist}`;
      } else if (status === "cancelled") {
        title = "Appointment cancelled";
        description = `${item.patientName}'s ${item.procedure} appointment was cancelled`;
      }

      return {
        id: index + 1,
        title,
        description,
        time: formatRelativeTime(item.createdAt),
      };
    });

  const treatmentCountMap = new Map();
  for (const booking of yearlyBookings) {
    const service = toServiceName(booking);
    treatmentCountMap.set(service, (treatmentCountMap.get(service) || 0) + 1);
  }

  const totalTreatments = Array.from(treatmentCountMap.values()).reduce((sum, value) => sum + value, 0);
  const topTreatments = Array.from(treatmentCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count], index) => ({
      label,
      value: totalTreatments > 0 ? `${Math.round((count / totalTreatments) * 100)}%` : "0%",
      count,
      color: PIE_COLORS[index],
    }));

  const monthlyMap = new Map();
  const currentYear = new Date().getFullYear();
  for (let month = 0; month < 12; month += 1) {
    const key = `${currentYear}-${String(month + 1).padStart(2, "0")}`;
    monthlyMap.set(key, {
      month: monthLabel(month),
      scheduled: 0,
      walkin: 0,
    });
  }

  for (const booking of yearlyBookings) {
    const key = monthKey(booking.appointment_date);
    if (!key || !monthlyMap.has(key)) continue;
    const bucket = monthlyMap.get(key);
    bucket.scheduled += 1;
    if (!booking.preassessment_id) {
      bucket.walkin += 1;
    }
  }

  const monthlyAppointments = Array.from(monthlyMap.values());

  return {
    success: true,
    statusCode: 200,
    data: {
      branch: queueResult.data.admin.branch,
      date: queueResult.data.date,
      totals: {
        appointments: todayBookings.length,
        waiting: waiting.length,
        completed: completed.length,
        confirmed,
        walkins,
        availableDentists: dentistCount,
      },
      liveQueue: current,
      nextPatient: waiting[0] || null,
      bookings: todayBookings,
      attendingDentists,
      recentActivity,
      topTreatments,
      monthlyAppointments,
    },
  };
};
