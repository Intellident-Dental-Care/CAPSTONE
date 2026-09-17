// server/AIRecommendation/analysisManager.js
//
// Holds the AI photo analysis as an in-flight promise outside React state.
// photo.js starts it right after upload; ai-summary.js awaits it later —
// usually instantly, since it's been running in the background.

const RAW_BASE = process.env.EXPO_PUBLIC_HF_API_URL || "https://intellident-intellidentai.hf.space/analyze";
const AI_BASE_URL = RAW_BASE.replace(/\/analyze\/?$/, "");
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN;

let currentAnalysisPromise = null;
let currentAnalysisUri = null;

function guessMimeType(uri) {
  const ext = (uri.split(".").pop() || "jpg").toLowerCase();
  return ext === "png" ? "image/png" : "image/jpeg";
}

// Fast check: is this actually a tooth photo? Call before accepting an upload.
export async function validateToothImage(imageUri) {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: `check.${imageUri.split(".").pop() || "jpg"}`,
      type: guessMimeType(imageUri),
    });

    const res = await fetch(`${AI_BASE_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${HF_TOKEN}` },
      body: formData,
    });

    if (!res.ok) return { success: false, error: `Validation server error (HTTP ${res.status})` };

    const data = await res.json();
    return { success: true, isTooth: !!data.is_tooth, confidence: data.confidence ?? 0 };
  } catch (err) {
    return { success: false, error: err.message || "Network error while validating photo." };
  }
}

// Starts the (slow) defect analysis in the background. Safe to call again —
// each call replaces the in-flight one; callers should use getAnalysisPromise().
export function startAnalysis(imageUri) {
  currentAnalysisUri = imageUri;

  currentAnalysisPromise = (async () => {
    try {
      const formData = new FormData();
      formData.append("file", { uri: imageUri, name: "tooth.jpg", type: guessMimeType(imageUri) });

      const res = await fetch(`${AI_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${HF_TOKEN}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

      const data = await res.json();
      return {
        success: true,
        problem: data.detected_problem || "None",
        description: data.description || "",
        confidence: data.confidence ?? 1.0,
      };
    } catch (err) {
      return { success: false, error: err.message || "AI analysis failed." };
    }
  })();

  return currentAnalysisPromise;
}

export function getAnalysisPromise() {
  return currentAnalysisPromise;
}

export function getAnalysisImageUri() {
  return currentAnalysisUri;
}

export function resetAnalysis() {
  currentAnalysisPromise = null;
  currentAnalysisUri = null;
}