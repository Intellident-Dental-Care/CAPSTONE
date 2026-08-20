import { supabaseAdmin } from "../../shared/supabaseClient.js";

export const getUnreadNotifications = async (adminId, branch) => {
  try {
    let query = supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .eq("admin_id", adminId)
      .eq("is_read", false)      
      .order("created_at", { ascending: false });

    if (branch && branch !== "All") {
      query = query.ilike("branch", `%${branch.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.message.includes("branch") && error.message.includes("column")) {
         const fallback = await supabaseAdmin
          .from("admin_notifications")
          .select("*")
          .eq("admin_id", adminId)
          .eq("is_read", false)      
          .order("created_at", { ascending: false });
         return { success: true, statusCode: 200, data: fallback.data || [] };
      }
      throw error;
    }

    return { success: true, statusCode: 200, data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, statusCode: 500, message: "Failed to fetch notifications" };
  }
};

export const markAllNotificationsAsRead = async (adminId, branch) => {
  try {
    let query = supabaseAdmin
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("admin_id", adminId)
      .eq("is_read", false);

    if (branch && branch !== "All") {
       query = query.ilike("branch", `%${branch.trim()}%`);
    }

    const { data, error } = await query.select();

    if (error) {
       if (error.message.includes("branch") && error.message.includes("column")) {
         const fallback = await supabaseAdmin
          .from("admin_notifications")
          .update({ is_read: true })
          .eq("admin_id", adminId)
          .eq("is_read", false)
          .select();
         return { success: true, statusCode: 200, message: "Notifications cleared", data: fallback.data };
       }
       throw error;
    }

    return { success: true, statusCode: 200, message: "Notifications cleared successfully", data };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false, statusCode: 500, message: "Failed to mark as read" };
  }
};