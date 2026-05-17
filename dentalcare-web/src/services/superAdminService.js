import AuthService from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

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

    if (response.status === 401 || response.status === 403) {
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

//QUESTIONNAIRE 

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