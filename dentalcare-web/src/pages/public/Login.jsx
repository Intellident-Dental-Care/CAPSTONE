import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthService from "../../services/authService";
import { preloadAdminData } from "../../services/adminService";
import { preloadDentistData } from "../../services/dentistService";
import logo from "../../assets/logo.png";
import clinicImage from "../../assets/picture4.png";

export default function Login() {
  const RESEND_COOLDOWN_SECONDS = 60;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = useMemo(() => {
    const role = searchParams.get("role");
    return role === "admin" ? "admin" : "dentist";
  }, [searchParams]);

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveUser, setSaveUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState("profile");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    contactDetail: "",
    newPassword: "",
    confirmPassword: "",
  });

  const monthOptions = useMemo(
    () => [
      { value: "01", label: "January" },
      { value: "02", label: "February" },
      { value: "03", label: "March" },
      { value: "04", label: "April" },
      { value: "05", label: "May" },
      { value: "06", label: "June" },
      { value: "07", label: "July" },
      { value: "08", label: "August" },
      { value: "09", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
    ],
    []
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 100 }, (_, index) => String(currentYear - index)),
    [currentYear]
  );

  const [dobParts, setDobParts] = useState({ year: "", month: "", day: "" });

  const dayOptions = useMemo(() => {
    const year = Number(dobParts.year) || currentYear;
    const monthIndex = Number(dobParts.month);
    if (!monthIndex) {
      return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
    }

    const daysInMonth = new Date(year, monthIndex, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [currentYear, dobParts.month, dobParts.year]);

  const normalizePhoneNumber = (value) => {
    let digits = (value || "").replace(/\D/g, "");

    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    return digits.slice(0, 10);
  };

  const formatLocalPhone = (value) => {
    const digits = normalizePhoneNumber(value);
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 10);

    if (digits.length <= 3) return p1;
    if (digits.length <= 6) return `${p1} ${p2}`;
    return `${p1} ${p2} ${p3}`;
  };

  const applyPendingVerification = (role, profile) => {
    const dobValue = profile?.dob || "";
    const [year = "", month = "", day = ""] = dobValue ? dobValue.split("-") : ["", "", ""];

    setActiveRole(role === "admin" ? "admin" : "dentist");
    setDobParts({ year, month, day });
    setProfileForm((prev) => ({
      ...prev,
      fullName: profile?.fullName || profile?.name || "",
      phone: normalizePhoneNumber(profile?.phone || profile?.phone_number || ""),
      dob: dobValue,
      gender: profile?.gender || "",
      contactDetail: profile?.contact_detail || profile?.contactDetail || profile?.email || email || "",
      newPassword: "",
      confirmPassword: "",
    }));
    setVerificationStep("profile");
    setShowVerifyModal(true);
  };

  useEffect(() => {
    // Do not auto-open verification modal from stale local state after refresh.
    AuthService.clearPendingVerification();
  }, []);

  useEffect(() => {
    if (verificationStep !== "otp" || resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationStep, resendCooldown]);

  const handleCloseVerificationModal = () => {
    setShowVerifyModal(false);
    setVerificationStep("profile");
    setOtpCode("");
    setResendCooldown(0);
    AuthService.clearPendingVerification();
  };

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const result =
        activeRole === "admin"
          ? await AuthService.adminLogin(email, password)
          : await AuthService.dentistLogin(email, password);

      if (!result?.success) {
        // Check if this is an account setup needed scenario
        if (result?.data?.accountNeedsSetup) {
          setError(
            'Your account needs authentication setup. Click "Forgot Password" below to complete the setup.'
          );
          return;
        }

        setError(result?.message || "Login failed.");
        return;
      }

      if (result?.requiresVerification) {
        applyPendingVerification(activeRole, result?.data?.profile);
        return;
      }

      if (activeRole === "admin") {
        await preloadAdminData();
        return;
    }

    if (
      activeRole === "admin" &&
      email.trim() === "superadmin" &&
      password === "superadmin123"
    ) {
      navigate("/superadmin/dashboard");
      return;
    }

    if (activeRole === "admin") {
        await preloadDentistData();
      }

      navigate(activeRole === "admin" ? "/admin/dashboard" : "/dentist/dashboard");
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSaveAndSendOtp = async () => {
    setError("");

    if (!profileForm.fullName || !profileForm.phone || !profileForm.contactDetail) {
      setError("Full name, contact number, and email are required.");
      return;
    }

    const localPhone = normalizePhoneNumber(profileForm.phone);
    if (localPhone.length < 10) {
      setError("Please enter a valid contact number.");
      return;
    }

    let normalizedDob = "";
    if (dobParts.year && dobParts.month && dobParts.day) {
      normalizedDob = `${dobParts.year}-${dobParts.month}-${dobParts.day}`;
    }

    const payload = {
      ...profileForm,
      phone: `+63${localPhone}`,
      dob: normalizedDob,
      contactDetail: profileForm.contactDetail.trim(),
    };

    if (payload.newPassword || payload.confirmPassword) {
      if (!payload.newPassword || !payload.confirmPassword) {
        setError("Please complete both password fields.");
        return;
      }

      if (payload.newPassword !== payload.confirmPassword) {
        setError("Password confirmation does not match.");
        return;
      }

      if (payload.newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const saveResult = await AuthService.completeProfile(payload);
      if (!saveResult?.success) {
        if (saveResult?.expiredVerification) {
          setShowVerifyModal(false);
        }
        setError(saveResult?.message || "Failed to update profile.");
        return;
      }

      if (saveResult?.otpSent) {
        setVerificationStep("otp");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        return;
      }

      const pending = AuthService.getPendingVerification();
      const otpResult = await AuthService.sendOtp({
        role: activeRole,
        profileId: pending?.profile?.id,
        email: payload.contactDetail,
        fullName: payload.fullName,
      });
      if (!otpResult?.success) {
        if (otpResult?.expiredVerification) {
          setShowVerifyModal(false);
        }
        setError(otpResult?.message || "Failed to send OTP.");
        return;
      }

      setVerificationStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");

    if (!otpCode || otpCode.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    const pending = AuthService.getPendingVerification();
    const result = await AuthService.verifyOtp(otpCode, {
      role: activeRole,
      profileId: pending?.profile?.id,
      email: profileForm.contactDetail?.trim(),
    });
    if (!result?.success) {
      setError(result?.message || "OTP verification failed.");
      return;
    }

    if (activeRole === "admin") {
      await preloadAdminData();
    }

    setShowVerifyModal(false);
    navigate(activeRole === "admin" ? "/admin/dashboard" : "/dentist/dashboard");
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffe3ee,_#fff7fa_34%,_#ffffff_72%)] p-3 sm:p-4 lg:p-6">
      <div className="grid h-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.12)] lg:grid-cols-[1.03fr_0.97fr]">
        {/* LEFT PANEL */}
        <div className="relative hidden h-full overflow-hidden lg:flex">
          <style>
            {`
              @keyframes slowZoom {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.04); }
              }

              @keyframes floatGlow {
                0%, 100% { transform: translate(0,0); }
                50% { transform: translate(20px,-15px); }
              }
            `}
          </style>

          <img
            src={clinicImage}
            alt="Clinic"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              animation: "slowZoom 5s ease-in-out infinite",
              objectPosition: "10% center",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/72 via-pink-100/42 to-white/10" />
          <div className="absolute inset-0 bg-slate-900/12" />

          <div
            className="absolute left-[-80px] top-[-80px] h-[260px] w-[260px] rounded-full bg-pink-300/40 blur-3xl"
            style={{ animation: "floatGlow 8s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-[-100px] right-[-60px] h-[260px] w-[260px] rounded-full bg-rose-200/40 blur-3xl"
            style={{ animation: "floatGlow 10s ease-in-out infinite" }}
          />

          <div className="relative z-20 flex h-full w-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-md">
                <img
                  src={logo}
                  alt="GC Dental Care Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h1 className="font-bold text-white">GC Dental Care</h1>
                <p className="text-sm text-white/80">Powered by IntelliDent</p>
              </div>
            </div>

            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md">
                Secure Access
              </div>

              <p className="mb-6 max-w-[430px] text-[17px] leading-7 text-white/92">
                Access your dashboard and manage appointments with a smoother,
                more organized experience.
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-md">
                  Dentists
                </span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-md">
                  Admins
                </span>
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-md">
                  Secure Login
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex h-full items-center justify-center overflow-hidden bg-[#fffafb] px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-pink-100 shadow-sm">
                  <img
                    src={logo}
                    alt="GC Dental Care Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                    GC Dental Care
                  </h2>
                  <p className="text-xs text-slate-500">Powered by IntelliDent</p>
                </div>
              </Link>
            </div>

            <div>
              <h3 className="text-4xl font-bold tracking-[-0.04em] text-slate-900">
                Login
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your dashboard
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-pink-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("dentist")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeRole === "dentist"
                      ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm"
                      : "text-slate-600 hover:bg-pink-50"
                  }`}
                >
                  Dentist Login
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeRole === "admin"
                      ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-sm"
                      : "text-slate-600 hover:bg-pink-50"
                  }`}
                >
                  Admin Login
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Email or Username
                </label>
                <input
                  type="text"
                  placeholder="youremail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveUser}
                    onChange={(e) => setSaveUser(e.target.checked)}
                    className="h-4 w-4 rounded border-pink-200 text-pink-500 focus:ring-pink-200"
                  />
                  Save User
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-md transition hover:opacity-95"
              >
                {loading
                  ? "Signing In..."
                  : activeRole === "dentist"
                  ? "Dentist Login"
                  : "Admin Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showVerifyModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-900">
                {verificationStep === "profile" ? "Complete Your Profile" : "Verify Your Email"}
              </h3>
              <button
                type="button"
                onClick={handleCloseVerificationModal}
                aria-label="Close profile modal"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-100 text-base font-semibold leading-none text-slate-500 transition hover:bg-pink-50 hover:text-slate-700"
              >
                X
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {verificationStep === "profile"
                ? "Please provide your details before accessing the full system."
                : "Enter the OTP sent to your email to activate your account."}
            </p>

            {verificationStep === "otp" && profileForm.contactDetail ? (
              <p className="mt-1 text-xs font-medium text-pink-700">
                OTP recipient: {profileForm.contactDetail}
              </p>
            ) : null}

            {verificationStep === "profile" ? (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

                <div className="rounded-xl border border-pink-100 px-3 py-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact Number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-pink-50 px-2 py-1 text-sm font-semibold text-pink-700">+63</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9XX XXX XXXX"
                      value={formatLocalPhone(profileForm.phone)}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phone: normalizePhoneNumber(e.target.value),
                        }))
                      }
                      className="w-full border-none bg-transparent px-0 py-1 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-pink-100 px-3 py-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date of Birth
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={dobParts.month}
                      onChange={(e) => setDobParts((prev) => ({ ...prev, month: e.target.value }))}
                      className="rounded-lg border border-pink-100 bg-white px-2 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">Month</option>
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={dobParts.day}
                      onChange={(e) => setDobParts((prev) => ({ ...prev, day: e.target.value }))}
                      className="rounded-lg border border-pink-100 bg-white px-2 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">Day</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>

                    <select
                      value={dobParts.year}
                      onChange={(e) => setDobParts((prev) => ({ ...prev, year: e.target.value }))}
                      className="rounded-lg border border-pink-100 bg-white px-2 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                    >
                      <option value="">Year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email (for OTP)
                </label>
                <input
                  type="email"
                  placeholder="youremail@gmail.com"
                  value={profileForm.contactDetail}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, contactDetail: e.target.value }))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

                <button
                  type="button"
                  onClick={handleProfileSaveAndSendOtp}
                  disabled={savingProfile}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2 font-semibold text-white transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {savingProfile ? "Saving and Sending OTP..." : "Save Profile and Send OTP"}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm tracking-[0.2em]"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2 font-semibold text-white"
                >
                  Verify OTP
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (resendCooldown > 0) {
                      return;
                    }

                    const resend = await AuthService.sendOtp();
                    if (!resend?.success) {
                      setError(resend?.message || "Failed to resend OTP.");
                      return;
                    }

                    setResendCooldown(RESEND_COOLDOWN_SECONDS);
                  }}
                  disabled={resendCooldown > 0}
                  className="w-full rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}