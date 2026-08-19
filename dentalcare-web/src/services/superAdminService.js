import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_LIVE_ORIGIN;

const baseHeaders = () => ({
  "Content-Type": "application/json",
  ...AuthService.getAuthHeader(),
});

const fetchJson = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: baseHeaders(),
      ...options,
    });

    if (response.status === 401) {
      AuthService.clearAuth();
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return { success: false, message: "Network connection failed." };
  }
};

export const getSuperAdminDashboard = async (startDate = "", endDate = "") => {
  let url = "/super_admin/dashboard/snapshot";
  const params = new URLSearchParams();
  
  if (startDate) params.append("start", startDate);
  if (endDate) params.append("end", endDate);
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return await fetchJson(url, { method: "GET" });
};

export const createSuperAdminFaq = async (payload) => {
  return await fetchJson("/super_admin/faqs", { 
    method: "POST", 
    body: JSON.stringify(payload) 
  });
};

export const getSuperAdminAdmins = async () => {
  return await fetchJson("/super_admin/admins", { method: "GET" });
};

export const createSuperAdminAdmin = async (payload) => {
  return await fetchJson("/super_admin/admins", { 
    method: "POST", 
    body: JSON.stringify(payload) 
  });
};

export const updateSuperAdminAdminStatus = async (id, isActive) => {
  return await fetchJson("/super_admin/admins/status", {
    method: "PATCH",
    body: JSON.stringify({ id, is_active: isActive }),
  });
};

export const getSuperAdminDentists = async () => {
  return await fetchJson("/super_admin/dentists", { method: "GET" });
};

export const createSuperAdminDentist = async (payload) => {
  return await fetchJson("/super_admin/dentists", { 
    method: "POST", 
    body: JSON.stringify(payload) 
  });
};

export const updateSuperAdminDentistStatus = async (id, isActive) => {
  return await fetchJson("/super_admin/dentists/status", {
    method: "PATCH",
    body: JSON.stringify({ id, is_active: isActive }),
  });
};

export const updateSuperAdminDentistSchedules = async (id, schedules) => {
  return await fetchJson("/super_admin/dentists/schedules", {
    method: "PATCH",
    body: JSON.stringify({ id, schedules }),
  });
};

export const getSuperAdminPatients = async () => {
  return await fetchJson("/super_admin/patients", { method: "GET" });
};

export const createSuperAdminService = async (payload) => {
  return await fetchJson("/super_admin/services", { 
    method: "POST", 
    body: JSON.stringify(payload) 
  });
};

export const getSuperAdminServices = async () => {
  return await fetchJson("/super_admin/services", { method: "GET" });
};

export const getSuperAdminServiceCategories = async () => {
  return await fetchJson("/super_admin/services/categories", { method: "GET" });
};

export const createSuperAdminServiceCategory = async (payload) => {
  return await fetchJson("/super_admin/services/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateSuperAdminServiceCategory = async (id, payload) => {
  return await fetchJson(`/super_admin/services/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const updateSuperAdminServiceCategoryStatus = async (ids, status) => {
  return await fetchJson("/super_admin/services/categories/status", {
    method: "PATCH",
    body: JSON.stringify({ ids, status }),
  });
};

export const getSuperAdminFaqs = async () => {
  return await fetchJson("/super_admin/faqs", { method: "GET" });
};

export const getSuperAdminTerms = async () => {
  return await fetchJson("/super_admin/terms", { method: "GET" });
};

export const saveSuperAdminTerms = async (terms) => {
  return await fetchJson("/super_admin/terms", {
    method: "PUT",
    body: JSON.stringify({ terms }),
  });
};

export const getSuperAdminQuestionnaire = async () => {
  return await fetchJson("/super_admin/questionnaire", {
    method: "GET",
  });
};

export const createSuperAdminQuestionnaire = async (payload) => {
  return await fetchJson("/super_admin/questionnaire", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateSuperAdminQuestionnaire = async (id, payload) => {
  return await fetchJson(`/super_admin/questionnaire/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteSuperAdminQuestionnaire = async (id) => {
  return await fetchJson(`/super_admin/questionnaire/${id}`, {
    method: "DELETE",
  });
};

const superAdminCache = {
  profile: null,
  avatarBlobCache: {},
};

export const buildSuperAdminAvatarImageUrl = (avatarPath) => {
  const cleanPath = String(avatarPath || "").trim();

  if (!cleanPath) return "";
  if (cleanPath.startsWith("blob:") || cleanPath.startsWith("data:") || cleanPath.startsWith("http")) {
    return cleanPath;
  }

  return `${API_BASE_URL}/super_admin/profile/image?path=${encodeURIComponent(cleanPath)}`;
};

export const loadSuperAdminAvatarObjectUrl = async (avatarPath) => {
  const imageUrl = buildSuperAdminAvatarImageUrl(avatarPath);

  if (!imageUrl) return "";
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) return imageUrl;

  if (superAdminCache.avatarBlobCache[avatarPath]) {
    return URL.createObjectURL(superAdminCache.avatarBlobCache[avatarPath]);
  }

  const response = await fetch(imageUrl, {
    method: "GET",
    headers: baseHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load superadmin avatar");
  }

  const blob = await response.blob();
  superAdminCache.avatarBlobCache[avatarPath] = blob;
  return URL.createObjectURL(blob);
};

export const getSuperAdminProfile = async () => {
  if (superAdminCache.profile) {
    return { success: true, data: superAdminCache.profile };
  }

  try {
    const data = await fetchJson("/super_admin/profile/me", { method: "GET" });
    if (data?.success) {
      superAdminCache.profile = data.data;
      
      const dbPath = data.data.avatarPath || data.data.avatarUrl || "";
      if (dbPath) {
        const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        userData.avatarPath = dbPath;
        userData.avatarUrl = dbPath;
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load superadmin profile" };
  }
};

export const updateSuperAdminProfile = async (payload) => {
  try {
    const data = await fetchJson("/super_admin/profile/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      superAdminCache.profile = data.data;
    } else {
      superAdminCache.profile = null;
    }

    return data;
  } catch (error) {
    superAdminCache.profile = null;
    return { success: false, message: "Failed to update superadmin profile" };
  }
};

export const uploadSuperAdminProfileAvatar = async ({ avatarBase64, fileName }) => {
  try {
    const data = await fetchJson("/super_admin/profile/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarBase64, fileName }),
    });

    if (data?.success) {
      superAdminCache.profile = data.data;
    } else {
      superAdminCache.profile = null;
    }

    return data;
  } catch (error) {
    superAdminCache.profile = null;
    return { success: false, message: "Failed to upload profile image" };
  }
};

export const fetchSuperAdminUnreadNotifications = async () => {
  try {
    const data = await fetchJson("/super_admin/notifications", { method: "GET" });
    return data; 
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, message: "Failed to fetch notifications", data: [] };
  }
};

export const markSuperAdminNotificationsAsRead = async () => {
  try {
    const data = await fetchJson("/super_admin/notifications/mark-read", { method: "PATCH" });
    return data; 
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false, message: "Failed to clear notifications" };
  }
};

