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
