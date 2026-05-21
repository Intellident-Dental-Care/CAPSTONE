import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const dentistCache = {
  dashboard: null,
  scheduleByKey: new Map(),
  profile: null,
  patientHistory: null,
};

const baseHeaders = () => ({
  "Content-Type": "application/json",
  ...AuthService.getAuthHeader(),
});

const fetchJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: baseHeaders(),
    ...options,
  });

  const data = await response.json();

  if (response.status === 401 || response.status === 403) {
    AuthService.clearAuth();
  }

  return data;
};

export const clearDentistCache = () => {
  dentistCache.dashboard = null;
  dentistCache.scheduleByKey = new Map();
  dentistCache.profile = null;
  dentistCache.patientHistory = null;
};

export const preloadDentistData = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      getDentistDashboardSnapshot({ forceRefresh: true }),
      getDentistProfile({ forceRefresh: true }),
      getDentistPatientHistory({ forceRefresh: true }),
      getDentistSchedule({ date: today, forceRefresh: true }),
    ]);

    return { success: true };
  } catch {
    return { success: false, message: "Failed to preload dentist data" };
  }
};

export const getDentistDashboardSnapshot = async (options = {}) => {
  const forceRefresh = !!options.forceRefresh;

  if (!forceRefresh && dentistCache.dashboard) {
    return { success: true, data: dentistCache.dashboard };
  }

  try {
    const data = await fetchJson("/dentist/dashboard/snapshot", { method: "GET" });
    if (data?.success) {
      dentistCache.dashboard = data.data;
    }
    return data;
  } catch {
    return { success: false, message: "Failed to load dentist dashboard" };
  }
};

export const getDentistSchedule = async ({ date, branch, forceRefresh } = {}) => {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (branch) params.set("branch", branch);

  const key = params.toString() || "default";
  if (!forceRefresh && dentistCache.scheduleByKey.has(key)) {
    return { success: true, data: dentistCache.scheduleByKey.get(key) };
  }

  try {
    const data = await fetchJson(`/dentist/schedule${params.toString() ? `?${params.toString()}` : ""}`, {
      method: "GET",
    });

    if (data?.success) {
      dentistCache.scheduleByKey.set(key, data.data);
    }

    return data;
  } catch {
    return { success: false, message: "Failed to load schedule" };
  }
};

export const getDentistProfile = async (options = {}) => {
  const forceRefresh = !!options.forceRefresh;

  if (!forceRefresh && dentistCache.profile) {
    return { success: true, data: dentistCache.profile };
  }

  try {
    const data = await fetchJson("/dentist/profile/me", { method: "GET" });
    if (data?.success) {
      dentistCache.profile = data.data;
    }
    return data;
  } catch {
    return { success: false, message: "Failed to load profile" };
  }
};

export const updateDentistProfile = async (payload) => {
  try {
    const data = await fetchJson("/dentist/profile/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      dentistCache.profile = data.data;
    }

    return data;
  } catch {
    return { success: false, message: "Failed to update profile" };
  }
};

export const getDentistPatientHistory = async (options = {}) => {
  const forceRefresh = !!options.forceRefresh;

  if (!forceRefresh && dentistCache.patientHistory) {
    return { success: true, data: dentistCache.patientHistory };
  }

  try {
    const data = await fetchJson("/dentist/patients/history", { method: "GET" });
    if (data?.success) {
      dentistCache.patientHistory = data.data;
    }
    return data;
  } catch {
    return { success: false, message: "Failed to load patient history" };
  }
};

export const getSecureImageBlob = async (imagePath) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dentist/dashboard/image/${imagePath}`, {
      method: "GET",
      headers: baseHeaders(), 
    });

    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching secure image blob:", error);
    return null;
  }
};

export const getSecureDentistImageBlob = async (imagePath) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dentist/patients/image/dentist/${imagePath}`, {
      method: "GET",
      headers: baseHeaders(), 
    });

    if (!response.ok) throw new Error("Failed to fetch image");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error fetching secure dentist image blob:", error);
    return null;
  }
};

export const createDentistProcedure = async (payload) => {
  try {
    const data = await fetchJson("/dentist/patients/procedures", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      // Invalidate dependent caches so timeline/dashboard refreshes with new procedure.
      dentistCache.patientHistory = null;
      dentistCache.dashboard = null;
    }

    return data;
  } catch {
    return { success: false, message: "Failed to save procedure" };
  }
};
