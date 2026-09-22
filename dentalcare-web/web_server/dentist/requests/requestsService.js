import { supabaseAdmin } from "../../shared/supabaseClient.js";

const REQUEST_TYPES = ["leave", "schedule_change"];

export const createDentistRequest = async (dentistId, payload = {}) => {
  const {
    requestType,
    leaveType,
    leaveDates,
    effectiveDate,
    requestedSchedules,
    reason,
    notes,
  } = payload;

  if (!dentistId) {
    return { success: false, statusCode: 400, message: "Missing dentist id" };
  }

  if (!REQUEST_TYPES.includes(requestType)) {
    return { success: false, statusCode: 400, message: "Invalid request type" };
  }

  if (!reason || !String(reason).trim()) {
    return { success: false, statusCode: 400, message: "Reason is required" };
  }

  const row = {
    dentist_id: dentistId,
    request_type: requestType,
    status: "Pending",
    reason: String(reason).trim(),
    notes: notes ? String(notes).trim() : null,
  };

  if (requestType === "leave") {
    if (!leaveType) {
      return { success: false, statusCode: 400, message: "Leave type is required" };
    }

    if (!Array.isArray(leaveDates) || leaveDates.length === 0) {
      return { success: false, statusCode: 400, message: "At least one leave date is required" };
    }

    row.leave_type = leaveType;
    row.leave_dates = leaveDates;
  }

  if (requestType === "schedule_change") {
    if (!effectiveDate) {
      return { success: false, statusCode: 400, message: "Effective date is required" };
    }

    if (!Array.isArray(requestedSchedules) || requestedSchedules.length === 0) {
      return { success: false, statusCode: 400, message: "At least one requested schedule is required" };
    }

    row.effective_date = effectiveDate;
    row.requested_schedules = requestedSchedules;
  }

  const { data, error } = await supabaseAdmin
    .from("dentist_requests")
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error("Error creating dentist request:", error);
    return { success: false, statusCode: 500, message: "Failed to submit request" };
  }

  return { success: true, statusCode: 201, data };
};

export const getDentistRequests = async (dentistId) => {
  if (!dentistId) {
    return { success: false, statusCode: 400, message: "Missing dentist id" };
  }

  const { data, error } = await supabaseAdmin
    .from("dentist_requests")
    .select("*")
    .eq("dentist_id", dentistId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching dentist requests:", error);
    return { success: false, statusCode: 500, message: "Failed to fetch requests" };
  }

  return { success: true, statusCode: 200, data: data || [] };
};
