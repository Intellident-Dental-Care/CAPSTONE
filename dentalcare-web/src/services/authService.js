const RAW_API_BASE_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return import.meta.env.VITE_LIVE_ORIGIN;
  }
};

const buildAuthEndpointCandidates = (authPath) => {
  const normalized = authPath.startsWith("/") ? authPath : `/${authPath}`;
  const candidates = [];

  candidates.push(`${API_BASE_URL}/auth${normalized}`);

  if (API_BASE_URL.endsWith("/api")) {
    const baseWithoutApi = API_BASE_URL.slice(0, -4);
    candidates.push(`${baseWithoutApi}/api/auth${normalized}`);
    candidates.push(`${baseWithoutApi}/auth${normalized}`);
  } else {
    candidates.push(`${API_BASE_URL}/api/auth${normalized}`);
    candidates.push(`${API_BASE_URL}/auth${normalized}`);
  }

  const apiOrigin = getApiOrigin();
  if (apiOrigin.includes("localhost")) {
    candidates.push(`http://127.0.0.1:5001/api/auth${normalized}`);
    candidates.push(`http://127.0.0.1:5001/auth${normalized}`);
  }

  if (apiOrigin.includes("127.0.0.1")) {
    const liveOrigin = import.meta.env.VITE_LIVE_ORIGIN;
    candidates.push(`${liveOrigin}/api/auth${normalized}`);
    candidates.push(`${liveOrigin}/auth${normalized}`);
  }

  return [...new Set(candidates)];
};

const buildOtpEndpointCandidates = () => {
  return [...new Set([...buildAuthEndpointCandidates("/send-otp"), ...buildAuthEndpointCandidates("/send-verification")])];
};

const buildOtpPublicEndpointCandidates = () => {
  const apiOrigin = getApiOrigin();
  const candidates = [
    `${apiOrigin}/api/auth/send-verification-public`,
    `${apiOrigin}/api/auth/resend-otp`,
    `${apiOrigin}/send-verification`,
    `${apiOrigin}/resend-otp`,
  ];

  if (apiOrigin.includes("localhost")) {
    candidates.push(
      "http://127.0.0.1:5001/api/auth/send-verification-public",
      "http://127.0.0.1:5001/api/auth/resend-otp",
      "http://127.0.0.1:5001/send-verification",
      "http://127.0.0.1:5001/resend-otp"
    );
  }

  if (apiOrigin.includes("127.0.0.1")) {
    const liveOrigin = import.meta.env.VITE_LIVE_ORIGIN;
    candidates.push(
      `${liveOrigin}/api/auth/send-verification-public`,
      `${liveOrigin}/api/auth/resend-otp`,
      `${liveOrigin}/send-verification`,
      `${liveOrigin}/resend-otp`
    );
  }

  return [...new Set(candidates)];
};

const buildVerifyOtpPublicEndpointCandidates = () => {
  const apiOrigin = getApiOrigin();
  const candidates = [
    `${apiOrigin}/api/auth/verify-otp-public`,
    `${apiOrigin}/verify-otp-public`,
  ];

  if (apiOrigin.includes("localhost")) {
    candidates.push("http://127.0.0.1:5001/api/auth/verify-otp-public", "http://127.0.0.1:5001/verify-otp-public");
  }

  if (apiOrigin.includes("127.0.0.1")) {
    const liveOrigin = import.meta.env.VITE_LIVE_ORIGIN;
    candidates.push(`${liveOrigin}/api/auth/verify-otp-public`, `${liveOrigin}/verify-otp-public`);
  }

  return [...new Set(candidates)];
};

const buildVerifyOtpProtectedEndpointCandidates = () => {
  const apiOrigin = getApiOrigin();
  const candidates = [
    `${API_BASE_URL}/auth/verify-otp`,
    `${apiOrigin}/verify-otp`,
  ];

  if (apiOrigin.includes("localhost")) {
    candidates.push("http://127.0.0.1:5001/api/auth/verify-otp", "http://127.0.0.1:5001/verify-otp");
  }

  if (apiOrigin.includes("127.0.0.1")) {
    const liveOrigin = import.meta.env.VITE_LIVE_ORIGIN;
    candidates.push(`${liveOrigin}/api/auth/verify-otp`, `${liveOrigin}/verify-otp`);
  }

  return [...new Set(candidates)];
};

const callFirstNon404 = async (endpoints, options) => {
  let response = null;

  for (const endpoint of endpoints) {
    response = await fetch(endpoint, options);
    if (response.status !== 404) {
      break;
    }
  }

  return response;
};

const parseJwtPayload = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = decodeURIComponent(
      atob(base64)
        .split("")
        .map((ch) => `%${`00${ch.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(normalized);
  } catch {
    return null;
  }
};

class AuthService {
  static setToken(token, role) {
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_role', role);
    }
  }

  static getToken() {
    return localStorage.getItem('auth_token');
  }

  static getRole() {
    return localStorage.getItem('auth_role');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('user_data');
    localStorage.removeItem('verification_token');
    localStorage.removeItem('pending_role');
    localStorage.removeItem('pending_profile');
  }

  static clearPendingVerification() {
    localStorage.removeItem('verification_token');
    localStorage.removeItem('pending_role');
    localStorage.removeItem('pending_profile');
  }

  static getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static getVerificationHeader() {
    const verificationToken = localStorage.getItem("verification_token");
    return verificationToken ? { Authorization: `Bearer ${verificationToken}` } : {};
  }

  static getVerificationClaims() {
    const verificationToken = localStorage.getItem("verification_token");
    return parseJwtPayload(verificationToken);
  }

  static async dentistLogin(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/dentist/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresVerification && data.data?.verificationToken) {
          localStorage.setItem("verification_token", data.data.verificationToken);
          localStorage.setItem("pending_role", "dentist");
          localStorage.setItem("pending_profile", JSON.stringify(data.data.profile || {}));
          return data;
        }

        this.setToken(data.data.token, 'dentist');
        localStorage.setItem('user_data', JSON.stringify(data.data.dentist));
        return data;
      }

      return data;
    } catch (error) {
      console.error('Dentist login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        error: error.message,
      };
    }
  }

  static async getDentistProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/dentist/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get dentist profile error:', error);
      return {
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message,
      };
    }
  }

  static async verifyDentistToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/dentist/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Dentist token verification error:', error);
      return {
        success: false,
        message: 'Token verification failed',
      };
    }
  }

  static async adminLogin(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresVerification && data.data?.verificationToken) {
          localStorage.setItem("verification_token", data.data.verificationToken);
          localStorage.setItem("pending_role", "admin");
          localStorage.setItem("pending_profile", JSON.stringify(data.data.profile || {}));
          return data;
        }

        this.setToken(data.data.token, 'admin');
        localStorage.setItem('user_data', JSON.stringify(data.data.admin));
        return data;
      }

      return data;
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
        error: error.message,
      };
    }
  }

  static async getAdminProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get admin profile error:', error);
      return {
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message,
      };
    }
  }

  static async verifyAdminToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Admin token verification error:', error);
      return {
        success: false,
        message: 'Token verification failed',
      };
    }
  }

  static async checkAdminPermission(permission) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/admin/check-permission/${permission}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
          },
        }
      );

      const data = await response.json();
      return data.hasPermission || false;
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  static async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      const data = await response.json();
      this.clearAuth();
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      this.clearAuth();
      return {
        success: true,
        message: 'Logged out',
      };
    }
  }

  static getPendingVerification() {
    const role = localStorage.getItem("pending_role");
    const profileText = localStorage.getItem("pending_profile");
    return {
      role,
      profile: profileText ? JSON.parse(profileText) : null,
      hasVerificationToken: !!localStorage.getItem("verification_token"),
    };
  }

  static async completeProfile(details) {
    try {
      const response = await callFirstNon404(buildAuthEndpointCandidates("/complete-profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getVerificationHeader(),
        },
        body: JSON.stringify(details),
      });

      if (!response) {
        return {
          success: false,
          message: "Failed to save profile",
        };
      }

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("verification_token");
        return {
          success: false,
          message: "Your verification session expired. Please log in again to continue profile verification.",
          expiredVerification: true,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to save profile",
      };
    }
  }

  static async sendOtp(payload = {}) {
    try {
      const pending = this.getPendingVerification();
      const claims = this.getVerificationClaims();
      const effectivePayload = {
        role: payload.role || claims?.role || pending?.role || null,
        profileId: payload.profileId || payload.userId || claims?.profileId || pending?.profile?.id || null,
        userId:
          payload.userId || payload.profileId || claims?.profileId || pending?.profile?.id || null,
        email: payload.email || claims?.email || pending?.profile?.email || "",
        fullName:
          payload.fullName ||
          pending?.profile?.fullName ||
          pending?.profile?.name ||
          pending?.profile?.full_name ||
          "User",
      };

      const headers = {
        "Content-Type": "application/json",
        ...this.getVerificationHeader(),
      };

      let response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: effectivePayload.email || undefined,
          fullName: effectivePayload.fullName || undefined,
        }),
      });

      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/auth/send-verification`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: effectivePayload.email || undefined,
            fullName: effectivePayload.fullName || undefined,
          }),
        });
      }

      if (!response || response.status === 404) {
        response = await callFirstNon404(buildOtpPublicEndpointCandidates(), {
          method: "POST",
          headers,
          body: JSON.stringify(effectivePayload),
        });
      }

      if (!response) {
        return {
          success: false,
          message: "Failed to send OTP",
        };
      }

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("verification_token");
        return {
          success: false,
          message: "Your verification session expired. Please log in again before requesting OTP.",
          expiredVerification: true,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: "OTP route not found on the running API. Start the web API from dentalcare-web using npm run dev:all.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to send OTP",
      };
    }
  }

  static async verifyOtp(otp, payload = {}) {
    try {
      const pending = this.getPendingVerification();
      const claims = this.getVerificationClaims();
      const protectedHeaders = {
        "Content-Type": "application/json",
        ...this.getVerificationHeader(),
      };
      const effectivePayload = {
        otp,
        role: payload.role || claims?.role || pending?.role || null,
        profileId: payload.profileId || payload.userId || claims?.profileId || pending?.profile?.id || null,
        userId:
          payload.userId || payload.profileId || claims?.profileId || pending?.profile?.id || null,
        email: payload.email || claims?.email || pending?.profile?.email || "",
      };

      let response = await callFirstNon404(buildVerifyOtpProtectedEndpointCandidates(), {
        method: "POST",
        headers: protectedHeaders,
        body: JSON.stringify({ otp }),
      });

      if (!response || response.status === 404) {
        response = await callFirstNon404(buildVerifyOtpPublicEndpointCandidates(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.getVerificationHeader(),
          },
          body: JSON.stringify(effectivePayload),
        });
      }

      if (!response) {
        return {
          success: false,
          message: "Failed to verify OTP",
        };
      }

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("verification_token");
        return {
          success: false,
          message: "Your verification session expired. Please log in again.",
          expiredVerification: true,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: "OTP verification route not found on running API. Restart with npm run dev:all.",
        };
      }

      if (data?.success && data?.data?.token) {
        const role = data?.data?.role || localStorage.getItem("pending_role") || "dentist";
        this.setToken(data.data.token, role);
        localStorage.setItem("user_data", JSON.stringify(data.data.profile || {}));
        this.clearPendingVerification();
      }

      if (data?.success && !data?.data?.token) {
        this.clearPendingVerification();
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to verify OTP",
      };
    }
  }

  static getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  static isDentist() {
    return this.getRole() === 'dentist';
  }

  static isAdmin() {
    return this.getRole() === 'admin';
  }

  static async forgotPasswordSendOtp(email) {
    const endpoints = buildAuthEndpointCandidates("/forgot-password/send-otp");

    try {
      const response = await callFirstNon404(endpoints, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.status === 404) {
        return {
          success: false,
          message: "Forgot password endpoint not found. Please try again.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to send OTP. Please check your email and try again.",
      };
    }
  }

  static async forgotPasswordVerifyOtp(email, otp, identity = null) {
    const endpoints = buildAuthEndpointCandidates("/forgot-password/verify-otp");

    try {
      const response = await callFirstNon404(endpoints, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(email || "").trim().toLowerCase(),
          otp: String(otp || "").trim(),
          role: identity?.role,
          profileId: identity?.profileId,
          userId: identity?.userId || identity?.profileId,
        }),
      });

      const data = await response.json();

      if (response.status === 404) {
        return {
          success: false,
          message: "OTP verification endpoint not found. Please try again.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      };
    }
  }

  static async forgotPasswordReset(resetToken, password, confirmPassword) {
    const endpoints = buildAuthEndpointCandidates("/forgot-password/reset");

    try {
      const response = await callFirstNon404(endpoints, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resetToken}`,
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (response.status === 404) {
        return {
          success: false,
          message: "Password reset endpoint not found. Please try again.",
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to reset password. Please try again.",
      };
    }
  }
}

export default AuthService;