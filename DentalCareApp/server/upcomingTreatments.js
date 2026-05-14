const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/", async (req, res) => {
  try {
    const { userId, profileId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    console.log("upcomingTreatments request:", { userId, profileId });

    // Get upcoming bookings (pending, confirmed)
    const today = new Date().toISOString().split('T')[0];
    
    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_date", today);
    
    // If profileId provided, filter by profile_id
    if (profileId && profileId !== "null" && profileId !== "") {
      console.log("Filtering by profileId:", profileId);
      query = query.eq("profile_id", profileId);
    } else {
      console.log("No profileId filter, getting user_id bookings only");
    }
    
    const { data: bookings, error: bookingErr } = await query.order("appointment_date", { ascending: true });

    if (bookingErr) {
      console.error("Booking query error:", bookingErr);
      throw bookingErr;
    }

    console.log("Found bookings:", bookings?.length || 0);

    // Get dental services to determine treatment vs routine
    const serviceNames = [...new Set(bookings.map(b => b.service).filter(Boolean))];
    let services = {};
    if (serviceNames.length > 0) {
      const { data: sData } = await supabaseAdmin
        .from("dental_services")
        .select("name, type, price_display")
        .in("name", serviceNames);
      
      if (sData) {
        sData.forEach(s => {
          services[s.name] = s;
        });
      }
    }

    // Get Dentists
    const dentistIds = [...new Set(bookings.map(b => b.dentist_id).filter(Boolean))];
    let dentists = {};
    if (dentistIds.length > 0) {
      const { data: dData } = await supabaseAdmin
        .from("dentist_list")
        .select("id, name")
        .in("id", dentistIds);
      
      if (dData) {
        dData.forEach(d => {
          dentists[d.id] = d;
        });
      }
    }

    // Get Pre-Assessments for additional details
    const paIds = [...new Set(bookings.map(b => b.preassessment_id).filter(Boolean))];
    let preassessments = {};
    if (paIds.length > 0) {
      const { data: paData } = await supabaseAdmin
        .from("patient_preassessment")
        .select("*")
        .in("id", paIds);
      
      if (paData) {
        paData.forEach(pa => {
          preassessments[pa.id] = pa;
        });
      }
    }

    // Format bookings
    const formattedTreatments = bookings
      .map(booking => {
        const svc = services[booking.service] || {};
        const dentist = dentists[booking.dentist_id] || {};
        const pa = booking.preassessment_id ? preassessments[booking.preassessment_id] : null;

        // Only include treatment-type services
        if (svc.type !== "Treatment") return null;

        const appointmentDate = new Date(booking.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });

        return {
          id: booking.id,
          user_id: booking.user_id,
          profile_id: booking.profile_id,
          service: booking.service || "Dental Procedure",
          title: booking.service || "Dental Procedure",
          dentist_id: booking.dentist_id,
          dentist_name: dentist.name || "Assigned Dentist",
          branch: booking.branch || "Branch TBD",
          appointment_date: booking.appointment_date,
          appointment_time: booking.appointment_time,
          date: formattedDate,
          time: booking.appointment_time ? formatTime(booking.appointment_time) : "-",
          status: booking.status,
          type: svc.type || "Treatment",
          preassessment_id: booking.preassessment_id,
          procedure_name: pa?.procedure_name || booking.service || "Dental Procedure",
          tooth: pa?.tooth_selected || "Not specified",
          description: pa?.description || "-",
          price_display: svc.price_display || "Contact clinic for pricing"
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: formattedTreatments });

  } catch (error) {
    console.error("Upcoming treatments fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

function formatTime(time24h) {
  if (!time24h) return "-";
  
  try {
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const parts = String(time24h).split(":");
    if (parts.length < 2) return "-";
    
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] || "00";
    
    if (isNaN(hours)) return "-";
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const modifier = hours >= 12 ? "PM" : "AM";
    
    return `${hour12}:${minutes} ${modifier}`;
  } catch (err) {
    console.error("formatTime error:", err);
    return "-";
  }
}

module.exports = router;
