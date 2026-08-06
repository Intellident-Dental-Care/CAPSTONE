export const getRecommendedServiceCriteria = (aiProblem, confidence = 1.0, qaList = [], description = "", aiBackendDescription = "") => {
  const sanitizeName = (str) => {
    if (!str) return "None";
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const sanitizedProblem = sanitizeName(aiProblem);

  const categories = {
    "Tooth Restoration": { score: 0, keywords: ["cavity", "chipped", "caries", "hole", "dark spot", "sweet", "sensitivity", "broken", "crack", "decay"] },
    "Orthodontics": { score: 0, keywords: ["crowding", "misaligned", "crooked", "uneven", "braces", "align", "straighten"] },
    "Oral Prophylaxis": { score: 0, keywords: ["plaque", "stain", "tartar", "calculus", "bleed", "gums", "bad breath"] },
    "Tooth Extraction": { score: 0, keywords: ["wisdom", "impacted", "severe swelling", "loose", "cannot be saved"] },
    "Root Canal": { score: 0, keywords: ["wakes you up", "night", "throbbing", "severe pain", "nerve", "pulsating"] },
    "Consultation": { score: 0, keywords: ["pain", "hurt", "discomfort", "checkup", "advice", "not sure"] }
  };

  const problemStr = sanitizedProblem.toLowerCase();
  let aiThinksItsHealthy = false;

  if (["cavity", "chipped", "caries"].includes(problemStr)) categories["Tooth Restoration"].score += 50;
  if (["crowding", "misaligned teeth", "misaligned"].includes(problemStr)) categories["Orthodontics"].score += 50;
  if (["plaque"].includes(problemStr)) categories["Oral Prophylaxis"].score += 50;
  
  if (["healthy", "normal", "none", "tooth"].includes(problemStr)) {
    categories["Oral Prophylaxis"].score += 50;
    aiThinksItsHealthy = true; 
  }

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


  const descStr = String(description || "").toLowerCase();
  Object.keys(categories).forEach(cat => {
    categories[cat].keywords.forEach(kw => {
      if (descStr.includes(kw)) {
        categories[cat].score += 25; 
        symptomPointsAccumulated += 25;
      }
    });
  });

  let displayProblem = sanitizedProblem;
  if (aiThinksItsHealthy) displayProblem = "None Detected";

  let displayDescription = aiBackendDescription;
  let finalCategory = "Consultation";

  if (confidence < 0.50 && symptomPointsAccumulated > 0) {
    finalCategory = "Consultation";
    displayDescription = `The AI detected potential signs of ${sanitizedProblem}, but with low certainty. Given the symptoms you reported, a professional dental consultation is highly recommended to accurately diagnose the issue.`;
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated >= 40) {
    finalCategory = "Consultation";
    displayDescription = "While the AI detected no visible structural damage on the surface, your reported symptoms strongly indicate an underlying issue. A comprehensive dental consultation and X-Ray evaluation are highly recommended.";
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated > 0) {
    finalCategory = "Consultation"; 
    displayDescription = "The AI found no visible external damage. However, because you are experiencing symptoms, a professional dental consultation is needed to rule out hidden problems.";
  } 
  else if (aiThinksItsHealthy && symptomPointsAccumulated === 0) {
    finalCategory = "Oral Prophylaxis";
    displayDescription = "The AI detected no visible issues, and no symptoms were reported. Routine oral prophylaxis (cleaning) is recommended to maintain optimal dental health.";
  } 
  else {
    let highestScore = -1;
    Object.keys(categories).forEach(cat => {
      if (categories[cat].score > highestScore) {
        highestScore = categories[cat].score;
        finalCategory = cat;
      }
    });
  }

  const resultMap = {
    "Tooth Restoration": { field: "name", value: "Restoration" },
    "Tooth Extraction": { field: "name", value: "Extraction" },
    "Root Canal": { field: "name", value: "Root Canal" },
    "Oral Prophylaxis": { field: "name", value: "Cleaning" },
    "Orthodontics": { field: "category", value: "Braces" },
    "Consultation": { field: "name", value: "Consultation" }
  };

  const finalQuery = resultMap[finalCategory] || { field: "name", value: "Consultation" };

  return {
    query: finalQuery,
    displayProblem: displayProblem,
    displayDescription: displayDescription || `A clinical evaluation for ${finalCategory} is recommended based on your assessment.`
  };
};