import { supabaseAdmin } from "../../shared/supabaseClient.js";
import { getTodayBranchBookings } from "../dashboard/dashboardService.js";

const STATUS_MAP = {
  waiting: "pending",
  "in queue": "confirmed",
  "in treatment": "in_treatment",
  in_treatment: "in_treatment",
  completed: "completed",
  cancelled: "cancelled",
};

const TABLE_MISSING_CODES = new Set(["PGRST205", "42P01"]);

const isTableMissing = (error) => {
  if (!error) return false;
  if (TABLE_MISSING_CODES.has(error.code)) return true;
  return String(error.message || "").toLowerCase().includes("does not exist");
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

const computeWaitMetrics = (bookings, totalDelayMinutes) => {
  const waiting = (bookings || []).filter(
    (item) => item.rawStatus === "confirmed" || item.status === "In Queue"
  );

  if (!waiting.length) {
    return {
      estimatedWaitMinutes: 0,
      nextPatientWaitMinutes: 0,
    };
  }

  const currentMins = currentMinutesOfDay();
  const nextWaiting = waiting[0] || null;
  const nextAppointmentMinutes = timeToMinutes(nextWaiting?.appointmentTimeRaw);

  let nextPatientWait = 0;

  if (nextAppointmentMinutes !== null) {
    const expectedStartMins = nextAppointmentMinutes + totalDelayMinutes;
    nextPatientWait = Math.max(0, expectedStartMins - currentMins);
  } else {
    nextPatientWait = 15;
  }

  const queueSpreadMinutes = waiting.length > 1 ? (waiting.length - 1) * 15 : 0;
  let estimatedWait = nextPatientWait + queueSpreadMinutes;

  const minWaitByLength = waiting.length * 15;
  estimatedWait = Math.max(estimatedWait, minWaitByLength);

  return {
    estimatedWaitMinutes: estimatedWait,
    nextPatientWaitMinutes: nextPatientWait,
  };
};

const getDelayState = async (branch, effectiveDate) => {
  const branches = branch ? branch.split("|").map((b) => b.trim()) : [];

  const { data, error } = await supabaseAdmin
    .from("queue_delay_state")
    .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
    .in("branch", branches)
    .eq("effective_date", effectiveDate)
    .order("total_delay_minutes", { ascending: false })
    .limit(1);

  if (error && !isTableMissing(error)) {
    throw error;
  }

  if (isTableMissing(error)) {
    return { tableMissing: true, row: null };
  }

  return { tableMissing: false, row: data?.[0] || null };
};

const upsertDelayState = async ({ branch, effectiveDate, adminProfileId, delayMinutes, message, isReset }) => {
  const branches = branch ? branch.split("|").map((b) => b.trim()) : [];
  let tableMissing = false;
  let highestDelay = 0;
  let lastData = null;

  for (const singleBranch of branches) {
    const existing = await supabaseAdmin
      .from("queue_delay_state")
      .select("id, total_delay_minutes, last_message")
      .eq("branch", singleBranch)
      .eq("effective_date", effectiveDate)
      .maybeSingle();

    if (existing.error && isTableMissing(existing.error)) {
      tableMissing = true;
      highestDelay = isReset ? 0 : delayMinutes;
      break;
    }

    const calculatedTotal = isReset ? 0 : Number(existing.data?.total_delay_minutes || 0) + delayMinutes;

    if (existing.data) {
      const { data, error } = await supabaseAdmin
        .from("queue_delay_state")
        .update({
          total_delay_minutes: calculatedTotal,
          last_message: message || existing.data.last_message || null,
          updated_by_admin_id: adminProfileId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id)
        .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
        .single();

      if (!error && data) {
        lastData = data;
        if (data.total_delay_minutes > highestDelay) highestDelay = data.total_delay_minutes;
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("queue_delay_state")
        .insert({
          branch: singleBranch,
          effective_date: effectiveDate,
          total_delay_minutes: calculatedTotal,
          last_message: message || null,
          updated_by_admin_id: adminProfileId,
        })
        .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
        .single();

      if (error && isTableMissing(error)) {
        tableMissing = true;
        break;
      }

      if (!error && data) {
        lastData = data;
        if (data.total_delay_minutes > highestDelay) highestDelay = data.total_delay_minutes;
      }
    }
  }

  return {
    tableMissing,
    delay: {
      branch,
      effectiveDate,
      totalDelayMinutes: highestDelay,
      lastMessage: message || lastData?.last_message || "",
    },
  };
};

const insertDelayNotifications = async ({ bookings, message, delayMinutes, adminProfileId, branch, effectiveDate }) => {
  const rows = (bookings || [])
    .filter((booking) => booking.userId)
    .map((booking) => ({
      user_id: booking.userId,
      booking_id: booking.id,
      branch: booking.branch || branch,
      effective_date: effectiveDate,
      delay_minutes: delayMinutes,
      message,
      created_by_admin_id: adminProfileId,
    }));

  if (!rows.length) {
    return { success: true, count: 0, tableMissing: false };
  }

  const { error } = await supabaseAdmin
    .from("queue_delay_notifications")
    .insert(rows);

  if (error && isTableMissing(error)) {
    return { success: false, count: 0, tableMissing: true };
  }

  if (error) {
    throw error;
  }

  return { success: true, count: rows.length, tableMissing: false };
};

const normalizeQueueWithDelay = async (queueResult, branch) => {
  const bookings = queueResult.data.bookings || [];
  const targetBranch = branch || queueResult.data.admin.branch;
  const effectiveDate = queueResult.data.date;

  const delayState = await getDelayState(targetBranch, effectiveDate);
  const totalDelayMinutes = delayState.row ? Number(delayState.row.total_delay_minutes || 0) : 0;
  const waitMetrics = computeWaitMetrics(bookings, totalDelayMinutes);

  return {
    ...queueResult,
    data: {
      ...queueResult.data,
      delay: {
        branch: targetBranch,
        effectiveDate,
        totalDelayMinutes,
        lastMessage: delayState.row?.last_message || "",
        updatedAt: delayState.row?.updated_at || null,
      },
      estimatedWaitMinutes: waitMetrics.estimatedWaitMinutes,
      nextPatientWaitMinutes: waitMetrics.nextPatientWaitMinutes,
    },
  };
};

export const getQueueForAdminBranch = async (adminProfileId, requestedBranch = null) => {
  const queueResult = await getTodayBranchBookings(adminProfileId, requestedBranch);
  if (!queueResult.success) {
    return queueResult;
  }

  const targetBranch = requestedBranch || queueResult.data.admin.branch;

  try {
    return await normalizeQueueWithDelay(queueResult, targetBranch);
  } catch (error) {
    const waitMetrics = computeWaitMetrics(queueResult.data.bookings || [], 0);

    return {
      ...queueResult,
      data: {
        ...queueResult.data,
        delay: {
          branch: targetBranch,
          effectiveDate: queueResult.data.date,
          totalDelayMinutes: 0,
          lastMessage: "",
          updatedAt: null,
        },
        estimatedWaitMinutes: waitMetrics.estimatedWaitMinutes,
        nextPatientWaitMinutes: waitMetrics.nextPatientWaitMinutes,
      },
    };
  }
};

export const updateBookingQueueStatus = async (adminProfileId, bookingId, status) => {
  const queueResult = await getTodayBranchBookings(adminProfileId);

  if (!queueResult.success) {
    return queueResult;
  }

  const allowedIds = new Set((queueResult.data.bookings || []).map((b) => b.id));

  if (!allowedIds.has(bookingId)) {
    return {
      success: false,
      statusCode: 403,
      message: "Cannot edit booking outside your branch or date scope",
    };
  }

  const mappedStatus = STATUS_MAP[(status || "").toString().trim().toLowerCase()];

  if (!mappedStatus) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid status value",
    };
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: mappedStatus })
    .eq("id", bookingId);

  if (error) {
    return {
      success: false,
      statusCode: 500,
      message: `Failed to update queue status: ${error.message || "Unknown database error"}`,
    };
  }

  return { success: true, statusCode: 200, message: "Queue status updated" };
};

export const applyQueueDelay = async (adminProfileId, payload = {}) => {
  const isReset = !!payload.reset;
  const delayMinutes = Number(payload.delayMinutes || 0);
  const message = String(payload.message || "").trim();
  const requestedBranch = payload.branch ? String(payload.branch).trim() : null;

  if (!isReset && (!Number.isFinite(delayMinutes) || delayMinutes <= 0)) {
    return {
      success: false,
      statusCode: 400,
      message: "delayMinutes must be a positive number",
    };
  }

  const queueResult = await getTodayBranchBookings(adminProfileId, requestedBranch);
  if (!queueResult.success) {
    return queueResult;
  }

  const branch = requestedBranch || queueResult.data.admin.branch;
  const effectiveDate = queueResult.data.date;
  const affectedBookings = (queueResult.data.bookings || []).filter(
    (booking) => booking.status === "In Queue" || booking.status === "In Treatment"
  );

  try {
    const delayStateResult = await upsertDelayState({
      branch,
      effectiveDate,
      adminProfileId,
      delayMinutes,
      message,
      isReset,
    });

    const defaultMessage = isReset
      ? "Great news! The clinic is back on schedule."
      : `Queue update: Estimated wait has been delayed by ${delayMinutes} minute${delayMinutes > 1 ? "s" : ""}.`;

    const notifyResult = await insertDelayNotifications({
      bookings: affectedBookings,
      message: message || defaultMessage,
      delayMinutes: isReset ? 0 : delayMinutes,
      adminProfileId,
      branch,
      effectiveDate,
    });

    const normalizedQueue = await normalizeQueueWithDelay(queueResult, branch);

    return {
      success: true,
      statusCode: 200,
      message: isReset ? "Delay reset successfully" : "Delay applied successfully",
      data: {
        delay: normalizedQueue.data.delay,
        estimatedWaitMinutes: normalizedQueue.data.estimatedWaitMinutes,
        nextPatientWaitMinutes: normalizedQueue.data.nextPatientWaitMinutes,
        affectedUsers: affectedBookings.filter((booking) => booking.userId).length,
        sentNotifications: notifyResult.count,
        warnings: [
          ...(delayStateResult.tableMissing ? ["queue_delay_state table is missing"] : []),
          ...(notifyResult.tableMissing ? ["queue_delay_notifications table is missing"] : []),
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: "Failed to apply queue delay",
      error: error?.message || String(error),
    };
  }
};