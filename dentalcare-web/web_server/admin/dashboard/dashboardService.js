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

const timeToMinutes = (timeValue) => {
  if (!timeValue) return null;
  const [h = "0", m = "0"] = String(timeValue).split(":");
  const hour = Number.parseInt(h, 10);
  const minute = Number.parseInt(m, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return (hour * 60) + minute;
};

const currentMinutesOfDay = () => {
  const now = new Date();
  return (now.getHours() * 60) + now.getMinutes();
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

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const attendanceLabel = (targetDate) => {
  const today = startOfDay(new Date());
  const selected = startOfDay(targetDate);
  const diff = Math.round((selected.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return selected.toLocaleDateString("en-US", { weekday: "short" });
};

const toServiceName = (booking) => {
  const value = booking?.service || booking?.treatment || booking?.procedure || booking?.service_name;
  return value ? String(value) : "Dental Appointment";
};

const getAttendingDentistsByBranchSchedule = async (branch) => {
  const normalizedBranch = normalize(branch);
  if (!normalizedBranch) return [];

  const { data: schedules, error: schedulesError } = await supabaseAdmin
    .from("dentist_schedule")
    .select("dentist_id, branch, day_of_week, is_active")
    .eq("is_active", true);

  if (schedulesError) {
    return [];
  }

  const branchSchedules = (schedules || []).filter(
    (row) => normalize(row.branch) === normalizedBranch
  );

  if (!branchSchedules.length) {
    return [];
  }

  const dentistIds = [...new Set(branchSchedules.map((row) => row.dentist_id).filter(Boolean))];
  if (!dentistIds.length) {
    return [];
  }

  const { data: dentists, error: dentistsError } = await supabaseAdmin
    .from("dentist_list")
    .select("id, name")
    .in("id", dentistIds);

  if (dentistsError) {
    return [];
  }

  const today = startOfDay(new Date());
  const targetDates = [today, addDays(today, 1)];

  const scheduleGroups = targetDates
    .map((date) => {
      const day = date.getDay();
      const dentistIdsForDay = [
        ...new Set(
          branchSchedules
            .filter((row) => Number(row.day_of_week) === day)
            .map((row) => row.dentist_id)
            .filter(Boolean)
        ),
      ];

      return {
        iso: toISODate(date),
        label: attendanceLabel(date),
        dayOrder: Math.round((startOfDay(date).getTime() - today.getTime()) / 86400000),
        dentistIds: dentistIdsForDay,
      };
    })
    .filter((group) => group.dentistIds.length > 0);

  if (!scheduleGroups.length) {
    return [];
  }

  const allDentistIds = [...new Set(scheduleGroups.flatMap((group) => group.dentistIds))];
  const allDates = [...new Set(scheduleGroups.map((group) => group.iso))];

  const { data: dayBookings, error: bookingsError } = await supabaseAdmin
    .from("bookings")
    .select("dentist_id, status, branch, appointment_date")
    .in("appointment_date", allDates)
    .in("dentist_id", allDentistIds);

  if (bookingsError) {
    return [];
  }

  const countByDentistAndDate = new Map();
  for (const booking of dayBookings || []) {
    if (normalize(booking.branch) !== normalizedBranch) continue;
    if (normalize(booking.status) === "cancelled") continue;

    const key = `${booking.dentist_id}__${booking.appointment_date}`;
    countByDentistAndDate.set(key, (countByDentistAndDate.get(key) || 0) + 1);
  }

  const dentistById = new Map((dentists || []).map((d) => [d.id, d]));

  let rowId = 1;
  return scheduleGroups
    .flatMap((group) =>
      group.dentistIds.map((dentistId) => {
        const name = dentistById.get(dentistId)?.name || "Unassigned";
        const count = countByDentistAndDate.get(`${dentistId}__${group.iso}`) || 0;

        return {
          id: rowId++,
          name,
          patients: `${count} Appointment${count > 1 ? "s" : ""} (${group.label})`,
          status: group.label,
          statusClass: toStatusClass(group.label === "Today" ? "On-Duty" : "Upcoming"),
          dayOrder: group.dayOrder,
          appointmentCount: count,
        };
      })
    )
    .sort((a, b) => {
      if (a.dayOrder !== b.dayOrder) return a.dayOrder - b.dayOrder;
      if (b.appointmentCount !== a.appointmentCount) return b.appointmentCount - a.appointmentCount;
      return a.name.localeCompare(b.name);
    })
    .map(({ dayOrder, appointmentCount, ...row }) => row);
};

const getBranchDelayForDate = async (branch, effectiveDate) => {
  const { data, error } = await supabaseAdmin
    .from("queue_delay_state")
    .select("total_delay_minutes, last_message, updated_at")
    .eq("branch", branch)
    .eq("effective_date", effectiveDate)
    .maybeSingle();

  if (error) {
    const tableMissing =
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      String(error.message || "").toLowerCase().includes("does not exist");

    if (tableMissing) {
      return { totalDelayMinutes: 0, lastMessage: "", updatedAt: null };
    }

    throw error;
  }

  return {
    totalDelayMinutes: Number(data?.total_delay_minutes || 0),
    lastMessage: data?.last_message || "",
    updatedAt: data?.updated_at || null,
  };
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
      user_id,
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
        userId: row.user_id,
        queueNumber: index + 1,
        patientName: row.patient_name,
        branch: row.branch,
        date: row.appointment_date,
        appointmentTimeRaw: row.appointment_time,
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

  let delayInfo = { totalDelayMinutes: 0, lastMessage: "", updatedAt: null };
  try {
    delayInfo = await getBranchDelayForDate(queueResult.data.admin.branch, queueResult.data.date);
  } catch {
    delayInfo = { totalDelayMinutes: 0, lastMessage: "", updatedAt: null };
  }

  const todayBookings = queueResult.data.bookings;
  const yearlyBookings = annualResult.data || [];

  const current = todayBookings.find((b) => b.status === "In Queue") || todayBookings[0] || null;
  const waiting = todayBookings.filter((b) => b.status === "Waiting");
  const nextWaiting = waiting[0] || null;
  const completed = todayBookings.filter((b) => b.status === "Completed");
  const confirmed = todayBookings.filter((b) => normalize(b.rawStatus) === "confirmed").length;
  const walkins = todayBookings.filter((b) => !b.preassessmentId).length;

  const dentistCount = new Set(todayBookings.map((b) => b.dentist).filter((name) => name && name !== "Unassigned")).size;

  const nextAppointmentMinutes = timeToMinutes(nextWaiting?.appointmentTimeRaw);
  const untilNext = nextAppointmentMinutes === null ? 15 : Math.max(0, nextAppointmentMinutes - currentMinutesOfDay());
  const nextPatientWaitBase = waiting.length ? untilNext : 0;
  const queueSpreadMinutes = waiting.length > 1 ? (waiting.length - 1) * 15 : 0;
  const estimatedWaitBase = waiting.length ? Math.max(waiting.length * 15, nextPatientWaitBase + queueSpreadMinutes) : 0;

  const nextPatientWaitMinutes = waiting.length ? nextPatientWaitBase + delayInfo.totalDelayMinutes : 0;
  const estimatedWaitMinutes = waiting.length ? estimatedWaitBase + delayInfo.totalDelayMinutes : 0;

  const attendingDentists = await getAttendingDentistsByBranchSchedule(queueResult.data.admin.branch);

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
      nextPatient: nextWaiting,
      nextPatientWaitMinutes,
      estimatedWaitMinutes,
      queueDelay: delayInfo,
      bookings: todayBookings,
      attendingDentists,
      recentActivity,
      topTreatments,
      monthlyAppointments,
    },
  };
};
