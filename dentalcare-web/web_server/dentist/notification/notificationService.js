import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const getUnreadDentistNotifications = async (dentistId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("dentist_notifications")
      .select("*")
      .eq("dentist_id", dentistId)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, statusCode: 200, data };
  } catch (error) {
    console.error("Error fetching dentist notifications:", error);
    return { success: false, statusCode: 500, message: "Failed to fetch notifications" };
  }
};

export const markDentistNotificationsAsRead = async (dentistId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("dentist_notifications")
      .update({ is_read: true })
      .eq("dentist_id", dentistId)
      .eq("is_read", false)
      .select();

    if (error) throw error;
    return { success: true, statusCode: 200, message: "Notifications cleared successfully", data };
  } catch (error) {
    console.error("Error marking dentist notifications as read:", error);
    return { success: false, statusCode: 500, message: "Failed to mark as read" };
  }
};