import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_LIVE_ORIGIN;

// Cached data is reused across page/tab switches and only refetched once it is
// older than CACHE_TTL_MS, after a mutation clears it, or when forceRefresh is passed.
// dashboard and queue hold one entry per branch ("" = default/all).
const CACHE_TTL_MS = 60 * 1000;

const adminCache = {
  fetchedAt: {},
  profile: null,
  appointments: null,
  dentists: null,
  patients: null,
  queue: null,
  dashboard: null,
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
  return response.json();
};

export const buildAdminAvatarImageUrl = (avatarPath) => {
  const cleanPath = String(avatarPath || "").trim();

  if (!cleanPath) return "";
  if (cleanPath.startsWith("blob:") || cleanPath.startsWith("data:") || cleanPath.startsWith("http")) {
    return cleanPath;
  }

  return `${API_BASE_URL}/admin/profile/image?path=${encodeURIComponent(cleanPath)}`;
};

export const loadAdminAvatarObjectUrl = async (avatarPath) => {
  const imageUrl = buildAdminAvatarImageUrl(avatarPath);

  if (!imageUrl) return "";
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) return imageUrl;

  if (adminCache.avatarBlobCache[avatarPath]) {
    return URL.createObjectURL(adminCache.avatarBlobCache[avatarPath]);
  }

  const response = await fetch(imageUrl, {
    method: "GET",
    headers: baseHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load admin avatar");
  }

  const blob = await response.blob();
  adminCache.avatarBlobCache[avatarPath] = blob;
  return URL.createObjectURL(blob);
};

const markFetched = (name) => {
  adminCache.fetchedAt[name] = Date.now();
};

const isFresh = (name) =>
  Date.now() - (adminCache.fetchedAt[name] || 0) < CACHE_TTL_MS;

const readKeyed = (name, key) =>
  adminCache[name] && isFresh(`${name}:${key}`) ? adminCache[name][key] || null : null;

const writeKeyed = (name, key, data) => {
  adminCache[name] = { ...(adminCache[name] || {}), [key]: data };
  markFetched(`${name}:${key}`);
};

export const getAdminCache = () => ({ ...adminCache });

export const clearAdminCache = () => {
  adminCache.fetchedAt = {};
  adminCache.profile = null;
  adminCache.appointments = null;
  adminCache.dentists = null;
  adminCache.patients = null;
  adminCache.queue = null;
  adminCache.dashboard = null;
  adminCache.loadedAt = null;
};

window.addEventListener("auth:cleared", () => {
  clearAdminCache();
  adminCache.avatarBlobCache = {};
});

export const preloadAdminData = async () => {
  try {
    const [profileResult, appointmentsResult, dentistsResult, patientsResult, queueResult, dashboardResult] =
      await Promise.all([
        fetchJson("/admin/profile/me", { method: "GET" }),
        fetchJson("/admin/appointments", { method: "GET" }),
        fetchJson("/admin/dentists", { method: "GET" }),
        fetchJson("/admin/patients", { method: "GET" }),
        fetchJson("/admin/queuecontrol/today", { method: "GET" }),
        fetchJson("/admin/dashboard/snapshot", { method: "GET" }),
      ]);

    if (profileResult?.success && profileResult.data) {
      adminCache.profile = profileResult.data;
      markFetched("profile");

      const dbPath = profileResult.data.avatarPath || profileResult.data.avatarUrl || "";
      if (dbPath) {
        const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        userData.avatarPath = dbPath;
        userData.avatarUrl = dbPath;
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
    }

    if (appointmentsResult?.success) {
      adminCache.appointments = appointmentsResult.data;
      markFetched("appointments");
    }
    if (dentistsResult?.success) {
      adminCache.dentists = dentistsResult.data;
      markFetched("dentists");
    }
    if (patientsResult?.success) {
      adminCache.patients = patientsResult.data;
      markFetched("patients");
    }
    if (queueResult?.success) writeKeyed("queue", "", queueResult.data);
    if (dashboardResult?.success) writeKeyed("dashboard", "", dashboardResult.data);
    adminCache.loadedAt = new Date().toISOString();

    return {
      success: true,
      data: getAdminCache(),
    };
  } catch {
    return { success: false, message: "Failed to preload admin data" };
  }
};

export const getDashboardSnapshot = async (options = {}) => {
  const forceRefresh = !!options.forceRefresh;
  const branchParam = options.branch ? `?branch=${encodeURIComponent(options.branch)}` : "";

  const cacheKey = options.branch || "";
  const cachedDashboard = forceRefresh ? null : readKeyed("dashboard", cacheKey);
  if (cachedDashboard) {
    return { success: true, data: cachedDashboard };
  }

  try {
    const data = await fetchJson(`/admin/dashboard/snapshot${branchParam}`, { method: "GET" });
    if (data?.success) {
      writeKeyed("dashboard", cacheKey, data.data);
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load dashboard snapshot" };
  }
};

export const getTodayQueue = async (options = {}) => {
  const forceRefresh = !!options.forceRefresh;
  const branchParam = options.branch ? `?branch=${encodeURIComponent(options.branch)}` : "";

  const cacheKey = options.branch || "";
  const cachedQueue = forceRefresh ? null : readKeyed("queue", cacheKey);
  if (cachedQueue) {
    return { success: true, data: cachedQueue };
  }

  try {
    const data = await fetchJson(`/admin/queuecontrol/today${branchParam}`, { method: "GET" });
    if (data?.success) {
      writeKeyed("queue", cacheKey, data.data);
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load queue" };
  }
};

export const updateQueueStatus = async (bookingId, status, amountPaid = null) => {
  try {
    const data = await fetchJson("/admin/queuecontrol/status", {
      method: "PATCH",
      body: JSON.stringify({ bookingId, status, amountPaid }),
    });

    if (data?.success) {
      adminCache.queue = null;
      adminCache.dashboard = null;
      adminCache.appointments = null;
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to update queue status" };
  }
};

export const applyQueueDelay = async (payload) => {
  try {
    const data = await fetchJson("/admin/queuecontrol/delay", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      adminCache.queue = null;
      adminCache.dashboard = null;
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to apply queue delay" };
  }
};

export const getAdminProfile = async () => {
  if (adminCache.profile && isFresh("profile")) {
    return { success: true, data: adminCache.profile };
  }

  try {
    const data = await fetchJson("/admin/profile/me", { method: "GET" });
    if (data?.success) {
      adminCache.profile = data.data;
      markFetched("profile");

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
    return { success: false, message: "Failed to load admin profile" };
  }
};

export const updateAdminProfile = async (payload) => {
  try {
    const data = await fetchJson("/admin/profile/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      adminCache.profile = data.data;
      markFetched("profile");
    } else {
      adminCache.profile = null;
    }

    return data;
  } catch (error) {
    console.error("Profile update error:", error);
    adminCache.profile = null;
    return { success: false, message: "Failed to update admin profile" };
  }
};

export const uploadAdminProfileAvatar = async ({ avatarBase64, fileName }) => {
  try {
    const data = await fetchJson("/admin/profile/avatar", {
      method: "POST",
      body: JSON.stringify({ avatarBase64, fileName }),
    });

    if (data?.success) {
      adminCache.profile = data.data;
      markFetched("profile");
    } else {
      adminCache.profile = null;
    }

    return data;
  } catch (error) {
    console.error("Avatar upload error:", error);
    adminCache.profile = null;
    return { success: false, message: "Failed to upload profile image" };
  }
};

export const getAdminAppointments = async (options = {}) => {
  if (adminCache.appointments && !options.forceRefresh && isFresh("appointments")) {
    return { success: true, data: adminCache.appointments };
  }

  try {
    const data = await fetchJson("/admin/appointments", { method: "GET" });
    if (data?.success) {
      adminCache.appointments = data.data;
      markFetched("appointments");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load appointments" };
  }
};

export const updateAppointmentStatus = async (bookingId, status) => {
  try {
    const data = await fetchJson(`/admin/appointments/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (data?.success) {
      adminCache.appointments = null;
      adminCache.queue = null;
      adminCache.dashboard = null;
      adminCache.patients = null;
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to update appointment" };
  }
};

export const createWalkInAppointment = async (payload) => {
  try {
    const data = await fetchJson("/admin/appointments/walk-in", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data?.success) {
      adminCache.appointments = null;
      adminCache.queue = null;
      adminCache.dashboard = null;
      adminCache.patients = null;
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to create walk-in appointment" };
  }
};

export const getAdminDentists = async (options = {}) => {
  if (adminCache.dentists && !options.forceRefresh && isFresh("dentists")) {
    return { success: true, data: adminCache.dentists };
  }

  try {
    const data = await fetchJson("/admin/dentists", { method: "GET" });
    if (data?.success) {
      adminCache.dentists = data.data;
      markFetched("dentists");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load dentists" };
  }
};

export const getAdminPatients = async (options = {}) => {
  if (adminCache.patients && !options.forceRefresh && isFresh("patients")) {
    return { success: true, data: adminCache.patients };
  }

  try {
    const data = await fetchJson("/admin/patients", { method: "GET" });
    if (data?.success) {
      adminCache.patients = data.data;
      markFetched("patients");
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load patients" };
  }
};

export const resetQueueDelay = async (branch = "") => {
  try {
    const data = await fetchJson("/admin/queuecontrol/delay", {
      method: "POST",
      body: JSON.stringify({
        reset: true,
        branch,
        message: "The dentist has caught up. The clinic is now back on schedule.",
      }),
    });

    if (data?.success) {
      adminCache.queue = null;
      adminCache.dashboard = null;
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to reset queue delay" };
  }
};

export const isSuperAdmin = () => {
  const user = AuthService.getCurrentUser();
  return user?.admin_type === "super_admin" || user?.adminType === "super_admin";
};

export const setDentistLeave = async (dentistId, startDate, endDate, reason) => {
  try {
    const data = await fetchJson("/admin/dentists/leave", {
      method: "POST",
      body: JSON.stringify({ dentistId, startDate, endDate, reason }),
    });

    if (data?.success) {
      adminCache.dentists = null;
    }

    return data;
  } catch (error) {
    console.error("Error setting dentist leave:", error);
    return { success: false, message: "Failed to set leave" };
  }
};

export const cancelDentistLeave = async (leaveId) => {
  try {
    const data = await fetchJson(`/admin/dentists/leave/${leaveId}`, {
      method: "DELETE",
    });

    if (data?.success) {
      adminCache.dentists = null;
    }

    return data;
  } catch (error) {
    console.error("Error canceling leave:", error);
    return { success: false, message: "Failed to cancel leave" };
  }
};

export const getDentistLeaves = async (dentistId) => {
  try {
    const data = await fetchJson(`/admin/dentists/leaves/${dentistId}`, { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error fetching dentist leaves:", error);
    return { success: false, message: "Failed to fetch leaves", data: [] };
  }
};

export const checkLeaveConflict = async (dentistId, startDate, endDate) => {
  try {
    const data = await fetchJson("/admin/dentists/check-leave-conflict", {
      method: "POST",
      body: JSON.stringify({ dentistId, startDate, endDate }),
    });

    return data;
  } catch (error) {
    console.error("Error checking leave conflict:", error);
    return { success: false, message: "Failed to check leave conflict" };
  }
};

export const getLeaveRequests = async () => {
  try {
    const data = await fetchJson("/admin/requests/leave", { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return { success: false, message: "Failed to fetch leave requests", data: [] };
  }
};

export const reviewLeaveRequest = async (id, status, rejectionReason = "") => {
  try {
    const data = await fetchJson(`/admin/requests/leave/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (data?.success) {
      adminCache.dentists = null;
    }

    return data;
  } catch (error) {
    console.error("Error reviewing leave request:", error);
    return { success: false, message: "Failed to review leave request" };
  }
};

export const fetchUnreadNotifications = async (branch = "") => {
  try {
    const branchParam = branch && branch !== "All" ? `?branch=${encodeURIComponent(branch)}` : "";
    const data = await fetchJson(`/admin/notifications${branchParam}`, { method: "GET" });
    return data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, message: "Failed to fetch notifications", data: [] };
  }
};

export const markNotificationsAsRead = async (branch = "") => {
  try {
    const data = await fetchJson("/admin/notifications/mark-read", {
      method: "PATCH",
      body: JSON.stringify({ branch }),
    });
    return data;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false, message: "Failed to clear notifications" };
  }
};