import { supabaseAdmin } from "../../shared/supabaseClient.js";
import { getTodayBranchBookings } from "../dashboard/dashboardService.js";

const STATUS_MAP = {
  waiting: "pending",
  "in queue": "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

const TABLE_MISSING_CODES = new Set(["PGRST205", "42P01"]);

const isTableMissing = (error) => {
  if (!error) return false;
  if (TABLE_MISSING_CODES.has(error.code)) return true;
  return String(error.message || "").toLowerCase().includes("does not exist");
};

const getDelayState = async (branch, effectiveDate) => {
  const { data, error } = await supabaseAdmin
    .from("queue_delay_state")
    .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
    .eq("branch", branch)
    .eq("effective_date", effectiveDate)
    .maybeSingle();

  if (error && !isTableMissing(error)) {
    throw error;
  }

  if (isTableMissing(error)) {
    return { tableMissing: true, row: null };
  }

  return { tableMissing: false, row: data || null };
};

const upsertDelayState = async ({ branch, effectiveDate, adminProfileId, delayMinutes, message }) => {
  const existing = await getDelayState(branch, effectiveDate);
  if (existing.tableMissing) {
    return {
      tableMissing: true,
      delay: {
        branch,
        effectiveDate,
        totalDelayMinutes: delayMinutes,
        lastMessage: message || "",
      },
    };
  }

  if (existing.row) {
    const nextTotal = Number(existing.row.total_delay_minutes || 0) + delayMinutes;
    const { data, error } = await supabaseAdmin
      .from("queue_delay_state")
      .update({
        total_delay_minutes: nextTotal,
        last_message: message || existing.row.last_message || null,
        updated_by_admin_id: adminProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.row.id)
      .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
      .single();

    if (error) throw error;

    return {
      tableMissing: false,
      delay: {
        branch: data.branch,
        effectiveDate: data.effective_date,
        totalDelayMinutes: Number(data.total_delay_minutes || 0),
        lastMessage: data.last_message || "",
        updatedAt: data.updated_at,
      },
    };
  }

  const { data, error } = await supabaseAdmin
    .from("queue_delay_state")
    .insert({
      branch,
      effective_date: effectiveDate,
      total_delay_minutes: delayMinutes,
      last_message: message || null,
      updated_by_admin_id: adminProfileId,
    })
    .select("id, branch, effective_date, total_delay_minutes, last_message, updated_at")
    .single();

  if (error) throw error;

  return {
    tableMissing: false,
    delay: {
      branch: data.branch,
      effectiveDate: data.effective_date,
      totalDelayMinutes: Number(data.total_delay_minutes || 0),
      lastMessage: data.last_message || "",
      updatedAt: data.updated_at,
    },
  };
};

const insertDelayNotifications = async ({ bookings, message, delayMinutes, adminProfileId, branch, effectiveDate }) => {
  const rows = (bookings || [])
    .filter((booking) => booking.userId)
    .map((booking) => ({
      user_id: booking.userId,
      booking_id: booking.id,
      branch,
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

const normalizeQueueWithDelay = async (queueResult) => {
  const waitingCount = (queueResult.data.bookings || []).filter((item) => item.status === "Waiting").length;
  const branch = queueResult.data.admin.branch;
  const effectiveDate = queueResult.data.date;

  const delayState = await getDelayState(branch, effectiveDate);
  const totalDelayMinutes = delayState.row ? Number(delayState.row.total_delay_minutes || 0) : 0;

  return {
    ...queueResult,
    data: {
      ...queueResult.data,
      delay: {
        branch,
        effectiveDate,
        totalDelayMinutes,
        lastMessage: delayState.row?.last_message || "",
        updatedAt: delayState.row?.updated_at || null,
      },
      estimatedWaitMinutes: waitingCount > 0 ? (waitingCount * 15) + totalDelayMinutes : 0,
      nextPatientWaitMinutes: waitingCount > 0 ? 15 + totalDelayMinutes : 0,
    },
  };
};

export const getQueueForAdminBranch = async (adminProfileId) => {
  const queueResult = await getTodayBranchBookings(adminProfileId);
  if (!queueResult.success) {
    return queueResult;
  }

  try {
    return await normalizeQueueWithDelay(queueResult);
  } catch (error) {
    return {
      ...queueResult,
      data: {
        ...queueResult.data,
        delay: {
          branch: queueResult.data.admin.branch,
          effectiveDate: queueResult.data.date,
          totalDelayMinutes: 0,
          lastMessage: "",
          updatedAt: null,
        },
        estimatedWaitMinutes: (queueResult.data.bookings || []).filter((item) => item.status === "Waiting").length * 15,
        nextPatientWaitMinutes: (queueResult.data.bookings || []).some((item) => item.status === "Waiting") ? 15 : 0,
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
    return { success: false, statusCode: 500, message: "Failed to update queue status" };
  }

  return { success: true, statusCode: 200, message: "Queue status updated" };
};

export const applyQueueDelay = async (adminProfileId, payload = {}) => {
  const delayMinutes = Number(payload.delayMinutes || 0);
  const message = String(payload.message || "").trim();

  if (!Number.isFinite(delayMinutes) || delayMinutes <= 0) {
    return {
      success: false,
      statusCode: 400,
      message: "delayMinutes must be a positive number",
    };
  }

  const queueResult = await getTodayBranchBookings(adminProfileId);
  if (!queueResult.success) {
    return queueResult;
  }

  const branch = queueResult.data.admin.branch;
  const effectiveDate = queueResult.data.date;
  const affectedBookings = (queueResult.data.bookings || []).filter(
    (booking) => booking.status === "Waiting" || booking.status === "In Queue"
  );

  try {
    const delayStateResult = await upsertDelayState({
      branch,
      effectiveDate,
      adminProfileId,
      delayMinutes,
      message,
    });

    const defaultMessage = `Queue update: Estimated wait has been delayed by ${delayMinutes} minute${delayMinutes > 1 ? "s" : ""}.`;
    const notifyResult = await insertDelayNotifications({
      bookings: affectedBookings,
      message: message || defaultMessage,
      delayMinutes,
      adminProfileId,
      branch,
      effectiveDate,
    });

    const normalizedQueue = await normalizeQueueWithDelay(queueResult);

    return {
      success: true,
      statusCode: 200,
      message: "Delay applied successfully",
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
