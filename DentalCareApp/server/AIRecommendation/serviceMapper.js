export const getRecommendedServiceCriteria = (aiProblem, confidence = 1.0, qaList = [], description = "", aiBackendDescription = "") => {
  // 1. Sanitize the AI problem
  const sanitizeName = (str) => {
    if (!str) return "None";
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const sanitizedProblem = sanitizeName(aiProblem);

  // 2. Scalable Categories mapped to your NEW database structure
  const categories = {
    "Tooth Restoration": { score: 0, keywords: ["cavity", "chipped", "hole", "dark spot", "sweet", "sensitivity", "broken", "crack", "decay"] },
    "Orthodontics": { score: 0, keywords: ["crowding", "crooked", "uneven", "braces", "align", "straighten"] },
    "Oral Prophylaxis": { score: 0, keywords: ["plaque", "stain", "tartar", "calculus", "bleed", "gums", "bad breath"] },
    "Tooth Extraction": { score: 0, keywords: ["wisdom", "impacted", "severe swelling", "loose", "cannot be saved"] },
    "Root Canal": { score: 0, keywords: ["wakes you up", "night", "throbbing", "severe pain", "nerve", "pulsating"] },
    "Consultation": { score: 0, keywords: ["pain", "hurt", "discomfort", "checkup", "advice", "not sure"] }
  };

  const problemStr = sanitizedProblem.toLowerCase();
  let aiThinksItsHealthy = false;

  // Score based on the AI Output
  if (["cavity", "chipped"].includes(problemStr)) categories["Tooth Restoration"].score += 50;
  if (["crowding"].includes(problemStr)) categories["Orthodontics"].score += 50;
  if (["plaque"].includes(problemStr)) categories["Oral Prophylaxis"].score += 50;
  
  if (["healthy", "normal", "none", "tooth"].includes(problemStr)) {
    categories["Oral Prophylaxis"].score += 50;
    aiThinksItsHealthy = true; 
  }

  // Score the Questionnaire
  const affirmativeAnswers = ["yes", "sometimes", "often", "always", "true", "a little"];
  let symptomPointsAccumulated = 0;

  qaList.forEach(item => {
    const qText = String(item.question || item.qText || "").toLowerCase();
    const ansText = String(item.answer || item.ans || "").toLowerCase();

    if (affirmativeAnswers.some(affirmative => ansText.includes(affirmative))) {
      Object.keys(categories).forEach(cat => {
        categories[cat].keywords.forEach(kw => {
          if (qText.includes(kw)) {
            categories[cat].score += 20;
            symptomPointsAccumulated += 20;
          }
        });
      });
    }
  });

  // Score the Description
  const descStr = String(description || "").toLowerCase();
  Object.keys(categories).forEach(cat => {
    categories[cat].keywords.forEach(kw => {
      if (descStr.includes(kw)) {
        categories[cat].score += 25; 
        symptomPointsAccumulated += 25;
      }
    });
  });

  // --- SMART TEXT GENERATION ---
  let displayProblem = sanitizedProblem;
  if (aiThinksItsHealthy) displayProblem = "None Detected";

  let displayDescription = aiBackendDescription;
  let finalCategory = "Consultation";
  let searchField = "name"; // Default search column

  // --- CONFLICT RESOLUTION & FALLBACKS ---
  if (confidence < 0.50 && symptomPointsAccumulated > 0) {
    finalCategory = "Consultation";
    searchField = "name";
    displayDescription = `The AI detected potential signs of ${sanitizedProblem}, but with low certainty. Given the symptoms you reported, a professional dental consultation is highly recommended to accurately diagnose the issue.`;
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated >= 40) {
    finalCategory = "Consultation";
    searchField = "name";
    displayDescription = "While the AI detected no visible structural damage on the surface, your reported symptoms strongly indicate an underlying issue. A comprehensive dental consultation and X-Ray evaluation are highly recommended.";
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated > 0) {
    finalCategory = "Consultation"; 
    searchField = "name";
    displayDescription = "The AI found no visible external damage. However, because you are experiencing symptoms, a professional dental consultation is needed to rule out hidden problems.";
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated === 0) {
    finalCategory = "Cleaning";
    searchField = "name";
    displayDescription = "The AI detected no visible issues, and no symptoms were reported. Routine oral prophylaxis (cleaning) is recommended to maintain optimal dental health.";
  } 
  else {
    // Find highest score
    let highestScore = -1;
    Object.keys(categories).forEach(cat => {
      if (categories[cat].score > highestScore) {
        highestScore = categories[cat].score;
        finalCategory = cat;
      }
    });
  }

  // --- MAP TO THE NEW DATABASE STRUCTURE ---
  const resultMap = {
    "Tooth Restoration": { field: "name", value: "Restoration" }, // Finds "Tooth Restoration (Front)"
    "Tooth Extraction": { field: "name", value: "Extraction" },   // Finds "Anterior Extraction"
    "Root Canal": { field: "name", value: "Root Canal" },         // Finds "Root Canal Treatment"
    "Oral Prophylaxis": { field: "name", value: "Cleaning" },     // Finds "Light Cleaning"
    "Orthodontics": { field: "category", value: "Braces" },       // Finds any service in "Braces" category
    "Consultation": { field: "name", value: "Consultation" }      // Finds "General Consultation"
  };

  const finalQuery = resultMap[finalCategory] || { field: "name", value: "Consultation" };

  return {
    query: finalQuery,
    displayProblem: displayProblem,
    displayDescription: displayDescription || `A clinical evaluation for ${finalCategory} is recommended based on your assessment.`
  };
};