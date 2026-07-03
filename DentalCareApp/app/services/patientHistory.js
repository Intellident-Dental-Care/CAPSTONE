import { supabase } from '../../server/supabaseService'; 

export const fetchPatientHistory = async (userId, profileId) => {
  try {
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed");
    
    if (profileId && profileId !== "null" && profileId !== "") {
      query = query.eq("profile_id", profileId);
    }
    
    const { data: bookings, error: bookingErr } = await query.order("appointment_date", { ascending: false });
    if (bookingErr) throw bookingErr;
    if (!bookings?.length) return { success: true, data: [] };

    const [
      { data: services },
      { data: dentists },
      { data: preassessments },
      { data: procedures }
    ] = await Promise.all([
      supabase.from("dental_services").select("name, type, price_display"),
      supabase.from("dentist_list").select("id, name"),
      supabase.from("patient_preassessment").select("*").in("id", bookings.map(b => b.preassessment_id).filter(Boolean)),
      supabase.from("patient_procedures").select("*").in("booking_id", bookings.map(b => b.id))
    ]);

    const formattedItems = bookings.map(booking => {
      const svc = services?.find(s => s.name === booking.service) || {};
      const pa = preassessments?.find(p => p.id === booking.preassessment_id) || {};
      const dentist = dentists?.find(d => d.id === booking.dentist_id) || {};
      const proc = procedures?.find(p => p.booking_id === booking.id) || {};

      const dateObj = new Date(booking.appointment_date);
      const monthGroup = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const qaList = pa.answers 
        ? QUESTIONS.map((q, idx) => ({ question: q, answer: pa.answers[idx] || "-" })) 
        : [];

      return {
        monthGroup,
        doctor: dentist.name || "Assigned Dentist",
        title: booking.service || "Dental Procedure",
        type: svc.type || "Treatment",
        status: "Completed",
        date: formattedDate,
        time: booking.appointment_time || "-",
        tooth: pa.tooth_selected || proc.tooth || "Not specified",
        description: pa.description || "-",
        qaList: qaList,
        suggestedTreatment: booking.service || "-",
        suggestedPrice: svc.price_display || "-",
        procedure: proc.procedure_name || booking.service || "-",
        remarks: proc.remarks || "No remarks provided.",
        doctorPhotos: [proc.before_image_url, proc.after_image_url].filter(Boolean).map((uri, i) => ({ id: i, uri }))
      };
    });

    const groupedData = [];
    formattedItems.forEach(item => {
      let group = groupedData.find(g => g.month === item.monthGroup);
      if (!group) {
        group = { month: item.monthGroup, items: [] };
        groupedData.push(group);
      }
      group.items.push(item);
    });

    return { success: true, data: groupedData };
  } catch (error) {
    console.error("fetchPatientHistory Error:", error);
    return { success: false, message: error.message };
  }
};