const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// Using Service Role Key bypasses RLS automatically for backend operations
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/", async (req, res) => {
  console.log("\n=== 🦷 3D TIMELINE API HIT ===");
  try {
    let userId = req.query.userId;
    
    if (!userId) {
      console.log("❌ Error: Missing userId in query.");
      return res.status(400).json({ error: "Missing userId" });
    }
    
    console.log("1️⃣ Requested User ID:", userId);

    // Fetch sub-profiles to ensure we grab everything
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId);

    if (profError) console.error("⚠️ Profile Fetch Error:", profError.message);

    const profileIds = (profiles || []).map(p => p.id);
    const allPossibleIds = [userId, ...profileIds];
    
    console.log("2️⃣ Searching procedures for ALL these IDs:", allPossibleIds);

    // Fetch procedures using wildcard select to prevent column-name mismatch errors
    const { data: procedures, error: procError } = await supabaseAdmin
      .from("patient_procedures")
      .select("*") 
      .in("patient_id", allPossibleIds)
      .order("created_at", { ascending: false });

    if (procError) {
      console.error("❌ SUPABASE PROC ERROR:", procError);
      throw procError;
    }

    console.log(`3️⃣ Found ${procedures?.length || 0} procedures in database!`);
    if (procedures?.length > 0) {
      console.log("📄 First procedure preview:", JSON.stringify(procedures[0], null, 2));
    }

    const dentistIds = [...new Set((procedures || []).map((p) => p.dentist_id).filter(Boolean))];
    let dentistMap = new Map();
    
    if (dentistIds.length > 0) {
      const { data: dentists } = await supabaseAdmin
        .from("dentist_list")
        .select("id, name")
        .in("id", dentistIds);
        
      dentistMap = new Map((dentists || []).map((d) => [d.id, d.name]));
    }

    const formattedTimeline = (procedures || []).map((p) => {
      const dateVal = p.updated_at || p.created_at || new Date().toISOString();
      const dateObj = new Date(dateVal);
      const dateStr = Number.isNaN(dateObj.getTime()) 
        ? "-" 
        : dateObj.toLocaleDateString("en-PH", { month: "short", day: "2-digit", year: "numeric" });

      return {
        id: p.id,
        tooth: p.tooth || "Not specified",
        date: dateStr,
        title: p.procedure_name || "Dental Procedure",
        details: p.remarks || "No remarks provided.",
        doctor: dentistMap.get(p.dentist_id) || "Assigned Dentist",
      };
    });

    console.log("✅ Successfully returning formatted timeline to app.");
    return res.status(200).json({ success: true, data: formattedTimeline });
    
  } catch (error) {
    console.error("❌ Fatal Error fetching 3D timeline:", error);
    return res.status(500).json({ success: false, message: "Failed to load timeline data." });
  }
});

module.exports = router;