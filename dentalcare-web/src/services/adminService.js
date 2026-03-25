import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const adminCache = {
  profile: null,
  appointments: null,
  dentists: null,
  patients: null,
  queue: null,
  dashboard: null,
  loadedAt: null,
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

export const getAdminCache = () => ({ ...adminCache });

export const clearAdminCache = () => {
  adminCache.profile = null;
  adminCache.appointments = null;
  adminCache.dentists = null;
  adminCache.patients = null;
  adminCache.queue = null;
  adminCache.dashboard = null;
  adminCache.loadedAt = null;
};

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

    if (profileResult?.success) adminCache.profile = profileResult.data;
    if (appointmentsResult?.success) adminCache.appointments = appointmentsResult.data;
    if (dentistsResult?.success) adminCache.dentists = dentistsResult.data;
    if (patientsResult?.success) adminCache.patients = patientsResult.data;
    if (queueResult?.success) adminCache.queue = queueResult.data;
    if (dashboardResult?.success) adminCache.dashboard = dashboardResult.data;
    adminCache.loadedAt = new Date().toISOString();

    return {
      success: true,
      data: getAdminCache(),
    };
  } catch {
    return { success: false, message: "Failed to preload admin data" };
  }
};

export const getDashboardSnapshot = async () => {
  if (adminCache.dashboard) {
    return { success: true, data: adminCache.dashboard };
  }

  try {
    const data = await fetchJson("/admin/dashboard/snapshot", { method: "GET" });
    if (data?.success) {
      adminCache.dashboard = data.data;
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load dashboard snapshot" };
  }
};

export const getTodayQueue = async () => {
  if (adminCache.queue) {
    return { success: true, data: adminCache.queue };
  }

  try {
    const data = await fetchJson("/admin/queuecontrol/today", { method: "GET" });
    if (data?.success) {
      adminCache.queue = data.data;
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load queue" };
  }
};

export const updateQueueStatus = async (bookingId, status) => {
  try {
    const data = await fetchJson("/admin/queuecontrol/status", {
      method: "PATCH",
      body: JSON.stringify({ bookingId, status }),
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

export const getAdminProfile = async () => {
  if (adminCache.profile) {
    return { success: true, data: adminCache.profile };
  }

  try {
    const data = await fetchJson("/admin/profile/me", { method: "GET" });
    if (data?.success) {
      adminCache.profile = data.data;
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
    }

    return data;
  } catch (error) {
    return { success: false, message: "Failed to update admin profile" };
  }
};

export const getAdminAppointments = async () => {
  if (adminCache.appointments) {
    return { success: true, data: adminCache.appointments };
  }

  try {
    const data = await fetchJson("/admin/appointments", { method: "GET" });
    if (data?.success) {
      adminCache.appointments = data.data;
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

export const getAdminDentists = async () => {
  if (adminCache.dentists) {
    return { success: true, data: adminCache.dentists };
  }

  try {
    const data = await fetchJson("/admin/dentists", { method: "GET" });
    if (data?.success) {
      adminCache.dentists = data.data;
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load dentists" };
  }
};

export const getAdminPatients = async () => {
  if (adminCache.patients) {
    return { success: true, data: adminCache.patients };
  }

  try {
    const data = await fetchJson("/admin/patients", { method: "GET" });
    if (data?.success) {
      adminCache.patients = data.data;
    }
    return data;
  } catch (error) {
    return { success: false, message: "Failed to load patients" };
  }
};

export const isSuperAdmin = () => {
  const user = AuthService.getCurrentUser();
  return user?.admin_type === "super_admin" || user?.adminType === "super_admin";
};
