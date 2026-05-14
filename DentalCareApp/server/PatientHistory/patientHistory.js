const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUESTIONS = [
  "Do you feel tooth pain when biting or chewing?",
  "Do you experience sensitivity to cold drinks?",
  "Do you experience sensitivity to hot food/drinks?",
  "Do your gums bleed when brushing or flossing?",
  "Do you notice swelling in the gums or face?",
  "Do you have bad breath even after brushing?",
  "Do you see a visible hole or dark spot on the tooth?",
  "Do you feel pain that wakes you up at night?",
  "Do you feel pain when eating sweet food?",
  "Have you had a filling or dental treatment on this tooth before?",
];

router.get("/", async (req, res) => {
  try {
    const { userId, profileId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    console.log("patientHistory request:", { userId, profileId });

    // 1. Get Completed Bookings
    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed");
    
    // If profileId provided, filter by profile_id
    if (profileId && profileId !== "null" && profileId !== "") {
      console.log("Filtering by profileId:", profileId);
      query = query.eq("profile_id", profileId);
    } else {
      console.log("No profileId filter, getting user_id bookings only");
    }
    
    const { data: bookings, error: bookingErr } = await query.order("appointment_date", { ascending: false });

    if (bookingErr) {
      console.error("Booking query error:", bookingErr);
      throw bookingErr;
    }

    console.log("Found completed bookings:", bookings?.length || 0);

    if (!bookings || bookings.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Get Pre-Assessments
    const paIds = [...new Set(bookings.map(b => b.preassessment_id).filter(Boolean))];
    let preassessments = [];
    if (paIds.length > 0) {
      const { data: paData } = await supabaseAdmin
        .from("patient_preassessment")
        .select("*")
        .in("id", paIds);
      preassessments = paData || [];
    }

    // 3. Get Dental Services (for "Routine" vs "Treatment" and prices)
    const serviceNames = [...new Set(bookings.map(b => b.service).filter(Boolean))];
    let services = [];
    if (serviceNames.length > 0) {
      const { data: sData } = await supabaseAdmin
        .from("dental_services")
        .select("name, type, price_display")
        .in("name", serviceNames);
      services = sData || [];
    }

    // 4. Get Dentists
    const dentistIds = [...new Set(bookings.map(b => b.dentist_id).filter(Boolean))];
    let dentists = [];
    if (dentistIds.length > 0) {
      const { data: dData } = await supabaseAdmin
        .from("dentist_list")
        .select("id, name")
        .in("id", dentistIds);
      dentists = dData || [];
    }

    // 5. Get Procedures (for remarks, specific tooth, and photos)
    const bookingIds = bookings.map(b => b.id);
    let procedures = [];
    if (bookingIds.length > 0) {
      const { data: procData } = await supabaseAdmin
        .from("patient_procedures")
        .select("*")
        .in("booking_id", bookingIds);
      procedures = procData || [];
    }

    // 6. Combine and Format
    const formattedItems = bookings.map(booking => {
      const svc = services.find(s => s.name === booking.service) || {};
      const pa = preassessments.find(p => p.id === booking.preassessment_id) || {};
      const dentist = dentists.find(d => d.id === booking.dentist_id) || {};
      const proc = procedures.find(p => p.booking_id === booking.id) || {};

      const dateObj = new Date(booking.appointment_date);
      const monthGroup = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      let qaList = [];
      if (pa.answers) {
        qaList = QUESTIONS.map((q, idx) => ({
          question: q,
          answer: pa.answers[idx] || "-"
        }));
      }

      // Logic: Prioritize Pre-assessment tooth, fallback to Procedure tooth
      const finalTooth = pa.tooth_selected || proc.tooth || "Not specified";

      // Logic: Gather before/after photos
      let docPhotos = [];
      if (proc.before_image_url) docPhotos.push({ id: "before", uri: proc.before_image_url });
      if (proc.after_image_url) docPhotos.push({ id: "after", uri: proc.after_image_url });

      return {
        monthGroup,
        doctor: dentist.name || "Assigned Dentist",
        title: booking.service || "Dental Procedure",
        type: svc.type || "Treatment",
        status: "Completed",
        date: formattedDate,
        time: booking.appointment_time || "-",
        tooth: finalTooth,
        description: pa.description || "-",
        qaList: qaList,
        suggestedTreatment: booking.service || "-",
        suggestedPrice: svc.price_display || "-",
        procedure: proc.procedure_name || booking.service || "-",
        remarks: proc.remarks || "No remarks provided.",
        doctorPhotos: docPhotos 
      };
    });

    // 7. Group by Month
    const groupedData = [];
    formattedItems.forEach(item => {
      let group = groupedData.find(g => g.month === item.monthGroup);
      if (!group) {
        group = { month: item.monthGroup, items: [] };
        groupedData.push(group);
      }
      group.items.push(item);
    });

    res.json({ success: true, data: groupedData });

  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;