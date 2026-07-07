import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const dentistCache = {
  dashboard: null,
  scheduleByKey: new Map(),
  profile: null,
  patientHistory: null,
  loadedAt: null,
  avatarBlobCache: {},
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

export const getDentistCache = () => ({ ...dentistCache });

export const clearDentistCache = () => {
  dentistCache.dashboard = null;
  dentistCache.scheduleByKey = new Map();
  dentistCache.profile = null;
  dentistCache.patientHistory = null;
  dentistCache.loadedAt = null;
  dentistCache.avatarBlobCache = {};
};

export const buildDentistAvatarImageUrl = (avatarPath) => {
  const cleanPath = String(avatarPath || "").trim();

  if (!cleanPath) return "";
  if (cleanPath.startsWith("blob:") || cleanPath.startsWith("data:") || cleanPath.startsWith("http")) {
    return cleanPath;
  }

  return `${API_BASE_URL}/dentist/profile/image?path=${encodeURIComponent(cleanPath)}`;
};

export const loadDentistAvatarObjectUrl = async (avatarPath) => {
  const imageUrl = buildDentistAvatarImageUrl(avatarPath);

  if (!imageUrl) return "";
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) return imageUrl;

  // Check if blob is already cached (Identical to Admin)
  if (dentistCache.avatarBlobCache[avatarPath]) {
    return URL.createObjectURL(dentistCache.avatarBlobCache[avatarPath]);
  }

  const response = await fetch(imageUrl, {
    method: "GET",
    headers: baseHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load dentist avatar");
  }

  const blob = await response.blob();
  // Cache the blob data natively, not the URL
  dentistCache.avatarBlobCache[avatarPath] = blob;
  return URL.createObjectURL(blob);
};

export const preloadDentistData = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [profileResult, dashboardResult, historyResult, scheduleResult] = await Promise.all([
      fetchJson("/dentist/profile/me", { method: "GET" }),
      fetchJson("/dentist/dashboard/snapshot", { method: "GET" }),
      fetchJson("/dentist/patients/history", { method: "GET" }),
      fetchJson(`/dentist/schedule?date=${today}`, { method: "GET" }),
    ]);

    // PRELOAD FIX: Sync to localStorage exactly like adminService.js
    if (profileResult?.success && profileResult.data) {
      dentistCache.profile = profileResult.data;
      
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      
      // Cache details instantly to prevent UI flicker
      if (profileResult.data.fullName) userData.fullName = profileResult.data.fullName;
      if (profileResult.data.name) userData.name = profileResult.data.name;
      if (profileResult.data.specialization) userData.specialty = profileResult.data.specialization;
      
      const dbPath = profileResult.data.avatarPath || profileResult.data.avatarUrl || profileResult.data.profile_photo_url || "";
      if (dbPath) {
        userData.avatarPath = dbPath;
        userData.avatarUrl = dbPath;
        userData.profile_photo_url = dbPath;
      }
      
      localStorage.setItem("user_data", JSON.stringify(userData));
    }

    if (dashboardResult?.success) dentistCache.dashboard = dashboardResult.data;
    if (historyResult?.success) dentistCache.patientHistory = historyResult.data;
    if (scheduleResult?.success) dentistCache.scheduleByKey.set(`date=${today}`, scheduleResult.data);
    
    dentistCache.loadedAt = new Date().toISOString();

    return {
      success: true,
      data: getDentistCache(),
    };
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
    } else {
      dentistCache.profile = null;
    }

    return data;
  } catch {
    console.error("Profile update error:", error);
    dentistCache.profile = null;
    return { success: false, message: "Failed to update profile" };
  }
};

export const uploadDentistProfileAvatar = async ({ avatarBase64, fileName }) => {
  try {
    const data = await fetchJson("/dentist/profile/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarBase64, fileName }),
    });

    if (data?.success) {
      dentistCache.profile = data.data;
    } else {
      dentistCache.profile = null;
    }

    return data;
  } catch (error) {
    console.error("Avatar upload error:", error);
    dentistCache.profile = null;
    return { success: false, message: "Failed to upload profile image" };
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
      dentistCache.patientHistory = null;
      dentistCache.dashboard = null;
    }

    return data;
  } catch {
    return { success: false, message: "Failed to save procedure" };
  }
};

export const fetchUnreadDentistNotifications = async () => {
  try {
    const data = await fetchJson("/dentist/notifications", { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error fetching dentist notifications:", error);
    return { success: false, message: "Failed to fetch notifications", data: [] };
  }
};

export const markDentistNotificationsAsRead = async () => {
  try {
    const data = await fetchJson("/dentist/notifications/mark-read", { method: "PATCH" });
    return data; 
  } catch (error) {
    console.error("Error marking dentist notifications as read:", error);
    return { success: false, message: "Failed to clear notifications" };
  }
};