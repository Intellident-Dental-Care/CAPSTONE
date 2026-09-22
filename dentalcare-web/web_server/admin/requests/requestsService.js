import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const listLeaveRequests = async () => {
  const { data, error } = await supabaseAdmin
    .from("dentist_requests")
    .select("*, dentist_list(name, specialization, email)")
    .eq("request_type", "leave")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leave requests:", error);
    return { success: false, statusCode: 500, message: "Failed to fetch leave requests" };
  }

  return { success: true, statusCode: 200, data: data || [] };
};

const applyApprovedLeave = async (request, reviewerName) => {
  const dates = Array.isArray(request.leave_dates) ? request.leave_dates : [];

  if (dates.length === 0) return;

  const rows = dates.map((date) => ({
    dentist_id: request.dentist_id,
    start_date: date,
    end_date: date,
    reason: request.reason || "",
    updated_by: reviewerName,
  }));

  const { error } = await supabaseAdmin.from("dentist_leave").insert(rows);

  if (error) {
    console.error("Error applying approved leave:", error);
    throw error;
  }
};

const formatLeaveDateLabel = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatBookingTimeLabel = (timeValue) => {
  if (!timeValue) return "";
  const raw = String(timeValue);
  const [hourText = "0", minuteText = "00"] = raw.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const cancelBookingsForApprovedLeave = async (request) => {
  const dates = Array.isArray(request.leave_dates) ? request.leave_dates : [];
  if (dates.length === 0) {
    return { cancelledCount: 0 };
  }

  const { data: affectedBookings, error: bookingsError } = await supabaseAdmin
    .from("bookings")
    .select("id, user_id, patient_name, branch, service, appointment_date, appointment_time, status")
    .eq("dentist_id", request.dentist_id)
    .in("appointment_date", dates)
    .not("status", "in", "(cancelled,completed)");

  if (bookingsError) {
    console.error("Error fetching bookings affected by leave:", bookingsError);
    throw bookingsError;
  }

  if (!affectedBookings || affectedBookings.length === 0) {
    return { cancelledCount: 0 };
  }

  const bookingIds = affectedBookings.map((booking) => booking.id);

  const { error: cancelError } = await supabaseAdmin
    .from("bookings")
    .update({ status: "cancelled" })
    .in("id", bookingIds);

  if (cancelError) {
    console.error("Error cancelling bookings affected by leave:", cancelError);
    throw cancelError;
  }

  const { data: dentist } = await supabaseAdmin
    .from("dentist_list")
    .select("name")
    .eq("id", request.dentist_id)
    .maybeSingle();

  const dentistName = dentist?.name ? `Dr. ${dentist.name}` : "your dentist";

  const notificationRows = affectedBookings
    .filter((booking) => booking.user_id)
    .map((booking) => {
      const dateLabel = formatLeaveDateLabel(booking.appointment_date);
      const timeLabel = formatBookingTimeLabel(booking.appointment_time);
      const service = booking.service || "appointment";

      return {
        user_id: booking.user_id,
        booking_id: booking.id,
        dentist_id: request.dentist_id,
        branch: booking.branch || null,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time || null,
        message: `Your ${service} appointment on ${dateLabel}${timeLabel ? ` at ${timeLabel}` : ""} with ${dentistName} has been cancelled because ${dentistName} will be on leave that day. Please book a new appointment at your convenience. We apologize for the inconvenience.`,
      };
    });

  if (notificationRows.length > 0) {
    const { error: notifyError } = await supabaseAdmin
      .from("booking_cancellation_notifications")
      .insert(notificationRows);

    if (notifyError) {
      console.error("Error inserting booking cancellation notifications:", notifyError);
    }
  }

  return { cancelledCount: affectedBookings.length };
};

export const reviewLeaveRequest = async (id, { status, rejectionReason, reviewerName }) => {
  if (!id) {
    return { success: false, statusCode: 400, message: "Missing request id" };
  }

  if (!["Approved", "Rejected"].includes(status)) {
    return { success: false, statusCode: 400, message: "Invalid status" };
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("dentist_requests")
    .select("*")
    .eq("id", id)
    .eq("request_type", "leave")
    .single();

  if (fetchError || !existing) {
    return { success: false, statusCode: 404, message: "Leave request not found" };
  }

  if (existing.status !== "Pending") {
    return { success: false, statusCode: 400, message: "This request has already been reviewed" };
  }

  try {
    if (status === "Approved") {
      await applyApprovedLeave(existing, reviewerName);
      await cancelBookingsForApprovedLeave(existing);
    }
  } catch (error) {
    return { success: false, statusCode: 500, message: "Failed to apply approved leave" };
  }

  const { data, error } = await supabaseAdmin
    .from("dentist_requests")
    .update({
      status,
      rejection_reason: status === "Rejected" ? rejectionReason || "" : null,
      reviewed_by: reviewerName,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating leave request:", error);
    return { success: false, statusCode: 500, message: "Failed to update leave request" };
  }

  return { success: true, statusCode: 200, data };
};
