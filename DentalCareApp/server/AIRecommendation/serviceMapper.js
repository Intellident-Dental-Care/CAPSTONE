export const getRecommendedServiceCriteria = (aiProblem) => {
  const problem = (aiProblem || "").toLowerCase();

  const problemToServiceMap = {
    // Maintenance (Normal/Healthy teeth usually just need routine cleaning)
    "healthy": { field: "subcategory", value: "Oral Prophylaxis / Cleaning" },
    "normal": { field: "subcategory", value: "Oral Prophylaxis / Cleaning" },
    "tooth": { field: "subcategory", value: "Oral Prophylaxis / Cleaning" },

    // Stains
    "stain": { field: "name", value: "Stain Removal" },
    "black stain": { field: "name", value: "Stain Removal" },

    // Fillings & Restorations (Decay and Damage)
    "caries": { field: "subcategory", value: "Tooth Restoration" },
    "cavity": { field: "subcategory", value: "Tooth Restoration" },
    "crack": { field: "subcategory", value: "Tooth Restoration" },
    "decay": { field: "subcategory", value: "Tooth Restoration" },
    "decayed tooth": { field: "subcategory", value: "Tooth Restoration" },
    "early": { field: "subcategory", value: "Tooth Restoration" }, // Usually early decay
    "moderate": { field: "subcategory", value: "Tooth Restoration" }, // Usually moderate decay

    // Extractions & Wisdom Teeth
    "advanced": { field: "subcategory", value: "Tooth Extraction" }, // Advanced decay often needs extraction
    "impacted tooth": { field: "name", value: "Wisdom Tooth" },

    // Orthodontics
    "uneven tooth": { field: "category", value: "Braces" }, // Will match 'Conventional Metal Braces', 'Self Ligating Braces', etc.

    // Existing Work
    "filling": { field: "name", value: "Consultation" } // Recommends checking the existing filling
  };

  // Default fallback if the problem doesn't match the list above
  return problemToServiceMap[problem] || { field: "name", value: "Consultation" };
};