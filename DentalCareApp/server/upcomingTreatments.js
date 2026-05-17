const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchQuestions() {
  const { data, error } = await supabaseAdmin
    .from("questionnaire")
    .select("id, question_text, question_order")
    .eq("is_active", true)
    .order("question_order", { ascending: true });

  if (error) {
    console.error("Questionnaire fetch error:", error);
    return [];
  }

  return data || [];
}

function normalizeQaList(raw) {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function buildQaList(rawAnswers, questions = []) {
  if (!rawAnswers || questions.length === 0) return [];

  let parsedAnswers = rawAnswers;

  if (typeof parsedAnswers === "string") {
    try {
      parsedAnswers = JSON.parse(parsedAnswers);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsedAnswers) && parsedAnswers.length > 0) {
    return questions.map((q) => {
      const answerObj = parsedAnswers.find(
        (a) =>
          a?.questionId === q.id ||
          a?.questionId === String(q.id) ||
          a?.questionId === q.question_order ||
          a?.questionId === String(q.question_order)
      );

      return {
        question: q.question_text,
        answer: answerObj?.answer || "Not answered",
      };
    });
  }

  if (
    parsedAnswers &&
    typeof parsedAnswers === "object" &&
    Object.keys(parsedAnswers).length > 0
  ) {
    return questions.map((q) => ({
      question: q.question_text,
      answer:
        parsedAnswers[q.id] ||
        parsedAnswers[String(q.id)] ||
        parsedAnswers[q.question_order] ||
        parsedAnswers[String(q.question_order)] ||
        "Not answered",
    }));
  }

  return [];
}

router.get("/", async (req, res) => {
  try {
    const { userId, profileId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    console.log("upcomingTreatments request:", { userId, profileId });

    const today = new Date().toISOString().split("T")[0];

    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_date", today);

    if (profileId && profileId !== "null" && profileId !== "") {
      console.log("Filtering by profileId:", profileId);
      query = query.eq("profile_id", profileId);
    } else {
      console.log("No profileId filter, getting user_id bookings only");
    }

    const { data: bookings, error: bookingErr } = await query.order(
      "appointment_date",
      { ascending: true }
    );

    if (bookingErr) {
      console.error("Booking query error:", bookingErr);
      throw bookingErr;
    }

    console.log("Found bookings:", bookings?.length || 0);

    const serviceNames = [
      ...new Set((bookings || []).map((b) => b.service).filter(Boolean)),
    ];

    let services = {};
    if (serviceNames.length > 0) {
      const { data: sData } = await supabaseAdmin
        .from("dental_services")
        .select("name, type, price_display")
        .in("name", serviceNames);

      if (sData) {
        sData.forEach((s) => {
          services[s.name] = s;
        });
      }
    }

    const dentistIds = [
      ...new Set((bookings || []).map((b) => b.dentist_id).filter(Boolean)),
    ];

    let dentists = {};
    if (dentistIds.length > 0) {
      const { data: dData } = await supabaseAdmin
        .from("dentist_list")
        .select("id, name")
        .in("id", dentistIds);

      if (dData) {
        dData.forEach((d) => {
          dentists[d.id] = d;
        });
      }
    }

    const paIds = [
      ...new Set((bookings || []).map((b) => b.preassessment_id).filter(Boolean)),
    ];

    let preassessments = {};
    if (paIds.length > 0) {
      const { data: paData } = await supabaseAdmin
        .from("patient_preassessment")
        .select("*")
        .in("id", paIds);

      if (paData) {
        paData.forEach((pa) => {
          preassessments[pa.id] = pa;
        });
      }
    }

    const questions = await fetchQuestions();

    const formattedTreatments = (bookings || [])
      .map((booking) => {
        const svc = services[booking.service] || {};
        const dentist = dentists[booking.dentist_id] || {};
        const pa = booking.preassessment_id
          ? preassessments[booking.preassessment_id]
          : null;

        if (svc.type !== "Treatment") return null;

        const appointmentDate = new Date(booking.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        const qaListFromPreassessment = buildQaList(pa?.answers, questions);

        const fallbackQaList = normalizeQaList(
          booking.qa_list || booking.questionnaire
        );

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
          time: booking.appointment_time
            ? formatTime(booking.appointment_time)
            : "-",
          status: booking.status,
          type: svc.type || "Treatment",
          preassessment_id: booking.preassessment_id,
          procedure_name:
            pa?.procedure_name || booking.service || "Dental Procedure",
          tooth:
            pa?.tooth_selected ||
            booking.tooth_area ||
            booking.tooth ||
            "Not specified",
          description:
            pa?.description ||
            booking.description ||
            "No description provided.",
          qaList:
            qaListFromPreassessment.length > 0
              ? qaListFromPreassessment
              : fallbackQaList,
          price_display: svc.price_display || "Contact clinic for pricing",
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