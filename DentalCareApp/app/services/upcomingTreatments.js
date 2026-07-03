import { supabase } from '../../server/supabaseService'; 

function formatTime(time24h) {
  if (!time24h) return "-";
  const [h, m] = String(time24h).split(":");
  const hours = parseInt(h, 10);
  if (isNaN(hours)) return time24h;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour12}:${m || "00"} ${hours >= 12 ? "PM" : "AM"}`;
}

export const fetchUpcomingTreatments = async (userId, profileId) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true });

    if (profileId && profileId !== "null" && profileId !== "") {
      query = query.eq("profile_id", profileId);
    }

    const { data: bookings, error } = await query;
    if (error) throw error;
    if (!bookings || bookings.length === 0) return { success: true, data: [] };
    const { data: services } = await supabase.from("dental_services").select("name, type, price_display");

    const formatted = bookings.map(b => {
      const svc = services?.find(s => s.name === b.service) || {};
      
      const formattedStatus = b.status 
        ? b.status.charAt(0).toUpperCase() + b.status.slice(1) 
        : "Pending";

      return {
        ...b,
        status: formattedStatus,
        type: svc.type, 
        title: b.service || "Dental Procedure",
        date: new Date(b.appointment_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        time: formatTime(b.appointment_time),
        dentist_name: "Assigned Dentist", 
        description: b.description || "No description provided.",
        price_display: svc.price_display || "Contact clinic for pricing"
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Fetch Upcoming Treatments Error:", error);
    return { success: false, message: error.message };
  }
};