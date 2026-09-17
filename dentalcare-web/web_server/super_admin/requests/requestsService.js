import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const listScheduleRequests = async () => {
  const { data, error } = await supabaseAdmin
    .from("dentist_requests")
    .select("*, dentist_list(name, specialization, email)")
    .eq("request_type", "schedule_change")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching schedule requests:", error);
    return { success: false, statusCode: 500, message: "Failed to fetch schedule requests" };
  }

  return { success: true, statusCode: 200, data: data || [] };
};

const applyApprovedSchedule = async (request) => {
  const requestedSchedules = Array.isArray(request.requested_schedules)
    ? request.requested_schedules
    : [];

  const scheduleRows = [];

  for (const entry of requestedSchedules) {
    const days = Array.isArray(entry.days) ? entry.days : [];

    for (const day of days) {
      scheduleRows.push({
        dentist_id: request.dentist_id,
        branch: entry.branch,
        day_of_week: Number(day),
        start_time: `${entry.startTime}:00`,
        end_time: `${entry.endTime}:00`,
        is_active: true,
      });
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("dentist_schedule")
    .delete()
    .eq("dentist_id", request.dentist_id);

  if (deleteError) {
    console.error("Error clearing existing schedule:", deleteError);
    throw deleteError;
  }

  if (scheduleRows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("dentist_schedule")
      .insert(scheduleRows);

    if (insertError) {
      console.error("Error applying approved schedule:", insertError);
      throw insertError;
    }
  }
};

export const reviewScheduleRequest = async (id, { status, rejectionReason, reviewerName }) => {
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
    .eq("request_type", "schedule_change")
    .single();

  if (fetchError || !existing) {
    return { success: false, statusCode: 404, message: "Schedule request not found" };
  }

  if (existing.status !== "Pending") {
    return { success: false, statusCode: 400, message: "This request has already been reviewed" };
  }

  try {
    if (status === "Approved") {
      await applyApprovedSchedule(existing);
    }
  } catch (error) {
    return { success: false, statusCode: 500, message: "Failed to apply approved schedule" };
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
    console.error("Error updating schedule request:", error);
    return { success: false, statusCode: 500, message: "Failed to update schedule request" };
  }

  return { success: true, statusCode: 200, data };
};
