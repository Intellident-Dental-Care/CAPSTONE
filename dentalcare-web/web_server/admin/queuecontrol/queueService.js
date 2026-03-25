import { supabaseAdmin } from "../../shared/supabaseClient.js";
import { getTodayBranchBookings } from "../dashboard/dashboardService.js";

const STATUS_MAP = {
  waiting: "pending",
  "in queue": "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

export const getQueueForAdminBranch = async (adminProfileId) => {
  return getTodayBranchBookings(adminProfileId);
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
