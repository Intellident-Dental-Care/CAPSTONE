export const getRecommendedServiceCriteria = (aiProblem, qaList = [], description = "", aiBackendDescription = "") => {
  const categories = {
    "Tooth Restoration": { score: 0, keywords: ["hole", "dark spot", "sweet", "sensitivity", "cavity", "caries", "decay", "crack", "filling", "broken"] },
    "Tooth Extraction": { score: 0, keywords: ["wisdom", "impacted", "advanced", "severe swelling", "loose", "cannot be saved"] },
    "Root Canal": { score: 0, keywords: ["wakes you up", "night", "throbbing", "severe pain", "nerve", "pulsating"] },
    "Oral Prophylaxis / Cleaning": { score: 0, keywords: ["bleed", "gums", "bad breath", "stain", "healthy", "normal", "plaque", "tartar", "calculus"] },
    "Consultation": { score: 0, keywords: ["pain", "hurt", "discomfort", "checkup", "advice", "not sure"] }
  };

  const problemStr = String(aiProblem || "").toLowerCase();
  let aiThinksItsHealthy = false;
  
  // Score the AI
  if (["caries", "cavity", "decay", "crack", "early", "moderate"].includes(problemStr)) categories["Tooth Restoration"].score += 50;
  if (["advanced", "impacted tooth"].includes(problemStr)) categories["Tooth Extraction"].score += 50;
  
  // If the AI finds nothing or just identifies the "tooth"
  if (["stain", "black stain", "healthy", "normal", "tooth", "none"].includes(problemStr)) {
    categories["Oral Prophylaxis / Cleaning"].score += 50;
    aiThinksItsHealthy = true; 
  }

  // Score the Questionnaire
  const affirmativeAnswers = ["yes", "sometimes", "often", "always", "true"];
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
  let displayProblem = aiProblem;
  if (aiThinksItsHealthy) {
    displayProblem = "None Detected"; // Overrides "Tooth" or "Healthy"
  }

  let displayDescription = aiBackendDescription;
  let finalCategory = "Consultation";

  // --- CONFLICT RESOLUTION ---
  if (aiThinksItsHealthy && symptomPointsAccumulated >= 40) {
    // Severe symptoms but clean photo
    finalCategory = "Consultation";
    displayDescription = "While the AI detected no visible structural damage on the surface, your reported symptoms strongly indicate an underlying issue. A comprehensive dental consultation and X-Ray evaluation are highly recommended.";
  } else if (aiThinksItsHealthy && symptomPointsAccumulated > 0) {
    // Mild symptoms but clean photo
    finalCategory = "Consultation"; 
    displayDescription = "The AI found no visible external damage. However, because you are experiencing mild symptoms, a professional dental consultation is needed to rule out hidden problems.";
  } else if (aiThinksItsHealthy && symptomPointsAccumulated === 0) {
    // Clean photo and zero symptoms
    displayDescription = "The AI detected no visible issues, and no symptoms were reported. Routine oral prophylaxis (cleaning) is recommended to maintain optimal dental health.";
  }

  // If we didn't force a consultation due to a conflict, find the highest score
  if (!(aiThinksItsHealthy && symptomPointsAccumulated > 0)) {
    let highestScore = -1;
    Object.keys(categories).forEach(cat => {
      if (categories[cat].score > highestScore) {
        highestScore = categories[cat].score;
        finalCategory = cat;
      }
    });

    if (highestScore === 0) finalCategory = "Consultation";
  }

  const resultMap = {
    "Tooth Restoration": { field: "subcategory", value: "Tooth Restoration" },
    "Tooth Extraction": { field: "subcategory", value: "Tooth Extraction" },
    "Root Canal": { field: "subcategory", value: "Root Canal" },
    "Oral Prophylaxis / Cleaning": { field: "subcategory", value: "Oral Prophylaxis / Cleaning" },
    "Consultation": { field: "name", value: "Consultation" }
  };

  return {
    query: resultMap[finalCategory] || { field: "name", value: "Consultation" },
    displayProblem: displayProblem,
    displayDescription: displayDescription || "A clinical evaluation is recommended based on your assessment."
  };
};