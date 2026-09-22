import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

  // =========================================================
  // LOGIN STATES
  // =========================================================

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveUser, setSaveUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // ACCOUNT VERIFICATION STATES
  // =========================================================

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    contactDetail: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isLockedOut = error.includes(
    "Account locked due to too many login attempts"
  );

  // =========================================================
  // DATE OF BIRTH OPTIONS
  // =========================================================

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
    () =>
      Array.from({ length: 100 }, (_, i) =>
        String(currentYear - i)
      ),
    [currentYear]
  );

  const [dobParts, setDobParts] = useState({
    year: "",
    month: "",
    day: "",
  });

  const dayOptions = useMemo(() => {
    const year = Number(dobParts.year) || currentYear;
    const monthIndex = Number(dobParts.month);

    const daysInMonth = monthIndex
      ? new Date(year, monthIndex, 0).getDate()
      : 31;

    return Array.from({ length: daysInMonth }, (_, i) =>
      String(i + 1).padStart(2, "0")
    );
  }, [currentYear, dobParts.month, dobParts.year]);

  // =========================================================
  // PHONE NUMBER HELPERS
  // =========================================================

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

    if (digits.length <= 3) {
      return p1;
    }

    if (digits.length <= 6) {
      return `${p1} ${p2}`;
    }

    return `${p1} ${p2} ${p3}`;
  };

  // =========================================================
  // APPLY PENDING VERIFICATION
  // =========================================================

  const applyPendingVerification = (role, profile) => {
    const dobVal = profile?.dob || "";

    const [y = "", m = "", d = ""] = dobVal.split("-");

    setActiveRole(role);

    setDobParts({
      year: y,
      month: m,
      day: d,
    });

    setProfileForm({
      fullName: profile?.fullName || profile?.name || "",

      phone: normalizePhoneNumber(
        profile?.phone || profile?.phone_number || ""
      ),

      dob: dobVal,

      gender: profile?.gender || "",

      contactDetail:
        profile?.contact_detail ||
        profile?.contactDetail ||
        profile?.email ||
        email ||
        "",

      otp: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowVerifyModal(true);
  };

  // =========================================================
  // CLEAR PREVIOUS VERIFICATION
  // =========================================================

  useEffect(() => {
    AuthService.clearPendingVerification();
  }, []);

  // =========================================================
  // RESEND OTP COUNTDOWN
  // =========================================================

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) =>
        prev <= 1 ? 0 : prev - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // =========================================================
  // CLOSE VERIFICATION MODAL
  // =========================================================

  const handleCloseVerificationModal = () => {
    setShowVerifyModal(false);

    setProfileForm((prev) => ({
      ...prev,
      otp: "",
    }));

    setResendCooldown(0);

    AuthService.clearPendingVerification();
  };

  // =========================================================
  // CHANGE LOGIN ROLE
  // =========================================================

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
    setError("");
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      return setError("Please enter your email and password.");
    }

    try {
      setLoading(true);

      const res =
        activeRole === "admin"
          ? await AuthService.adminLogin(email, password)
          : await AuthService.dentistLogin(email, password);

      if (!res?.success) {
        return setError(res?.message || "Login failed.");
      }

      // Account still requires verification
      if (res?.requiresVerification) {
        return applyPendingVerification(
          activeRole,
          res?.data?.profile
        );
      }

      // ADMIN / SUPER ADMIN
      if (activeRole === "admin") {
        const data = res?.data?.admin || {};

        if (
          data.admin_type === "super_admin" ||
          data.adminType === "super_admin"
        ) {
          navigate("/superadmin/dashboard", {
            replace: true,
          });
        } else {
          await preloadAdminData();

          navigate("/admin/dashboard", {
            replace: true,
          });
        }
      }

      // DENTIST
      else {
        await preloadDentistData();

        navigate("/dentist/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "An error occurred while signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // COMPLETE ACCOUNT SETUP
  // =========================================================

  const handleCompleteSetup = async () => {
    setError("");

    if (
      !profileForm.fullName ||
      !profileForm.phone ||
      !profileForm.contactDetail
    ) {
      return setError(
        "Full name, contact number, and email are required."
      );
    }

    const localPhone = normalizePhoneNumber(
      profileForm.phone
    );

    if (localPhone.length < 10) {
      return setError(
        "Please enter a valid contact number."
      );
    }

    // Password validation
    if (
      profileForm.newPassword ||
      profileForm.confirmPassword
    ) {
      if (
        !profileForm.newPassword ||
        !profileForm.confirmPassword
      ) {
        return setError(
          "Please complete both password fields."
        );
      }

      if (
        profileForm.newPassword !==
        profileForm.confirmPassword
      ) {
        return setError("Passwords do not match.");
      }

      if (profileForm.newPassword.length < 8) {
        return setError(
          "Password must be at least 8 characters."
        );
      }
    }

    // OTP validation
    if (
      !profileForm.otp ||
      profileForm.otp.length !== 6
    ) {
      return setError(
        "Please enter the 6-digit OTP sent to your email."
      );
    }

    setSavingProfile(true);

    try {
      let normalizedDob = "";

      if (
        dobParts.year &&
        dobParts.month &&
        dobParts.day
      ) {
        normalizedDob = `${dobParts.year}-${dobParts.month}-${dobParts.day}`;
      }

      const payload = {
        ...profileForm,

        phone: `+63${localPhone}`,

        dob: normalizedDob,

        contactDetail:
          profileForm.contactDetail.trim(),
      };

      // Save profile
      const saveResult =
        await AuthService.completeProfile(payload);

      if (!saveResult?.success) {
        return setError(
          saveResult?.message ||
            "Failed to update profile."
        );
      }

      // Verify OTP
      const pending =
        AuthService.getPendingVerification();

      const verifyResult =
        await AuthService.verifyOtp(
          profileForm.otp,
          {
            role: activeRole,

            profileId:
              pending?.profile?.id,

            email:
              profileForm.contactDetail?.trim(),
          }
        );

      if (!verifyResult?.success) {
        return setError(
          verifyResult?.message ||
            "Invalid OTP code."
        );
      }

      setShowVerifyModal(false);

      // ADMIN / SUPER ADMIN
      if (activeRole === "admin") {
        const userProfile =
          verifyResult.data?.profile ||
          AuthService.getCurrentUser() ||
          {};

        if (
          userProfile?.admin_type ===
            "super_admin" ||
          userProfile?.adminType ===
            "super_admin"
        ) {
          navigate(
            "/superadmin/dashboard",
            {
              replace: true,
            }
          );
        } else {
          await preloadAdminData();

          navigate("/admin/dashboard", {
            replace: true,
          });
        }
      }

      // DENTIST
      else {
        await preloadDentistData();

        navigate("/dentist/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error(
        "Account setup error:",
        err
      );

      setError(
        "Account setup failed. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffe3ee,_#fff7fa_34%,_#ffffff_72%)] p-3 sm:p-4 lg:p-6">

      <div className="grid h-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow lg:grid-cols-[1.03fr_0.97fr]">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="relative hidden h-full overflow-hidden lg:flex">

          <style>
            {`
              @keyframes slowZoom {
                0%, 100% {
                  transform: scale(1);
                }

                50% {
                  transform: scale(1.04);
                }
              }

              @keyframes floatGlow {
                0%, 100% {
                  transform: translate(0, 0);
                }

                50% {
                  transform: translate(20px, -15px);
                }
              }
            `}
          </style>

          <img
            src={clinicImage}
            alt="GC Dental Care Clinic"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              animation: "slowZoom 5s infinite",
              objectPosition: "10%",
            }}
          />

          {/* Pink Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/72 via-pink-100/42 to-white/10" />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-slate-900/12" />

          {/* Left Content */}
          <div className="relative z-20 flex h-full w-full flex-col justify-between p-10">

            {/* Logo */}
            <div className="flex items-center gap-3">

              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-12 w-12 rounded-2xl bg-white/80 p-1"
              />

              <div>
                <h1 className="font-bold text-white">
                  GC Dental Care
                </h1>

                <p className="text-xs text-white/80">
                  Powered by IntelliDent
                </p>
              </div>

            </div>

            {/* Bottom Text */}
            <div>

              <div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                Secure Access
              </div>

              <p className="max-w-md text-white/90">
                Manage appointments, patient information,
                schedules, and clinic operations securely
                through IntelliDent.
              </p>

            </div>

          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="flex h-full items-center justify-center bg-[#fffafb] px-6 sm:px-10 lg:px-14">

          <div className="w-full max-w-md">

            {/* Brand */}
            <div className="mb-8 flex items-center gap-3">

              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-10 w-10"
              />

              <div>
                <h2 className="font-bold text-slate-900">
                  GC Dental Care
                </h2>

                <p className="text-xs text-slate-400">
                  Powered by IntelliDent
                </p>
              </div>

            </div>

            {/* Welcome */}
            <div>

              <h3 className="text-4xl font-bold tracking-tight text-slate-900">
                Welcome back!
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to GC Dental Care
              </p>

            </div>

            {/* =================================================
                ROLE SELECTOR
            ================================================= */}

            <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 ring-1 ring-pink-100">

              <button
                type="button"
                onClick={() =>
                  handleRoleChange("dentist")
                }
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  activeRole === "dentist"
                    ? "bg-pink-500 text-white shadow"
                    : "text-slate-600 hover:bg-pink-50"
                }`}
              >
                Dentist
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRoleChange("admin")
                }
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  activeRole === "admin"
                    ? "bg-pink-500 text-white shadow"
                    : "text-slate-600 hover:bg-pink-50"
                }`}
              >
                Admin
              </button>

            </div>

            {/* Role Description */}
            <p className="mt-3 text-xs text-slate-400">

              {activeRole === "dentist"
                ? "Access your dentist workspace and patient information."
                : "Access clinic administration and management tools."}

            </p>

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 pr-16 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-pink-500 transition hover:text-pink-600"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between gap-4">

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">

                  <input
                    type="checkbox"
                    checked={saveUser}
                    onChange={(e) =>
                      setSaveUser(
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 accent-pink-500"
                  />

                  Remember me

                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/forgot-password"
                    )
                  }
                  className="text-sm font-semibold text-pink-600 transition hover:text-pink-700"
                >
                  Forgot Password?
                </button>

              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={
                  loading || isLockedOut
                }
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3.5 font-bold uppercase tracking-widest text-white shadow-sm transition hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading
                  ? "Signing in..."
                  : isLockedOut
                  ? "Locked Out"
                  : "Login"}

              </button>

            </form>

          </div>
        </div>

      </div>

      {/* =====================================================
          ACCOUNT SETUP / VERIFICATION MODAL
      ===================================================== */}

      {showVerifyModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">

              <div>

                <h3 className="text-2xl font-bold text-slate-900">
                  Account Setup
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enter your details to complete your
                  profile.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseVerificationModal
                }
                aria-label="Close account setup"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-100 text-slate-500 transition hover:bg-pink-50"
              >
                ×
              </button>

            </div>

            {/* Modal Content */}
            <div className="mt-6 space-y-4">

              {/* Error inside modal */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <input
                type="text"
                placeholder="Full Name"
                value={
                  profileForm.fullName
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    fullName:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300"
              />

              {/* Phone */}
              <div className="flex items-center gap-2 rounded-xl border border-pink-100 px-3 py-2 focus-within:border-pink-300">

                <span className="text-sm font-semibold text-pink-700">
                  +63
                </span>

                <input
                  type="tel"
                  placeholder="9XX XXX XXXX"
                  value={formatLocalPhone(
                    profileForm.phone
                  )}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,

                      phone:
                        normalizePhoneNumber(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full border-none bg-transparent text-sm outline-none"
                />

              </div>

              {/* Gender */}
              <select
                value={profileForm.gender}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    gender:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none focus:border-pink-300"
              >

                <option value="">
                  Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

              {/* Passwords */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <input
                  type="password"
                  placeholder="New Password"
                  value={
                    profileForm.newPassword
                  }
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,

                      newPassword:
                        e.target.value,
                    })
                  }
                  className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300"
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={
                    profileForm.confirmPassword
                  }
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,

                      confirmPassword:
                        e.target.value,
                    })
                  }
                  className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300"
                />

              </div>

              {/* Date of Birth */}
              <div>

                <p className="mb-2 text-xs font-medium text-slate-500">
                  Date of Birth
                </p>

                <div className="grid grid-cols-3 gap-2">

                  {/* Month */}
                  <select
                    value={
                      dobParts.month
                    }
                    onChange={(e) =>
                      setDobParts({
                        ...dobParts,
                        month:
                          e.target.value,
                      })
                    }
                    className="rounded-xl border border-pink-100 p-2 text-sm outline-none focus:border-pink-300"
                  >

                    <option value="">
                      Month
                    </option>

                    {monthOptions.map(
                      (month) => (
                        <option
                          key={
                            month.value
                          }
                          value={
                            month.value
                          }
                        >
                          {month.label}
                        </option>
                      )
                    )}

                  </select>

                  {/* Day */}
                  <select
                    value={
                      dobParts.day
                    }
                    onChange={(e) =>
                      setDobParts({
                        ...dobParts,
                        day:
                          e.target.value,
                      })
                    }
                    className="rounded-xl border border-pink-100 p-2 text-sm outline-none focus:border-pink-300"
                  >

                    <option value="">
                      Day
                    </option>

                    {dayOptions.map(
                      (day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {day}
                        </option>
                      )
                    )}

                  </select>

                  {/* Year */}
                  <select
                    value={
                      dobParts.year
                    }
                    onChange={(e) =>
                      setDobParts({
                        ...dobParts,
                        year:
                          e.target.value,
                      })
                    }
                    className="rounded-xl border border-pink-100 p-2 text-sm outline-none focus:border-pink-300"
                  >

                    <option value="">
                      Year
                    </option>

                    {yearOptions.map(
                      (year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* OTP */}
              <div>

                <p className="mb-2 text-xs font-medium text-slate-500">
                  Verification Code
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={
                    profileForm.otp
                  }
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,

                      otp:
                        e.target.value.replace(
                          /\D/g,
                          ""
                        ),
                    })
                  }
                  className="w-full rounded-xl border border-pink-200 bg-pink-50 px-3 py-3 text-center font-bold tracking-[0.3em] outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                />

              </div>

              {/* Save & Verify */}
              <button
                type="button"
                onClick={
                  handleCompleteSetup
                }
                disabled={
                  savingProfile
                }
                className="w-full rounded-xl bg-pink-500 py-3 font-bold uppercase text-white shadow-lg transition hover:bg-pink-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >

                {savingProfile
                  ? "Saving..."
                  : "Save Profile & Verify"}

              </button>

              {/* Resend OTP */}
              <div className="mt-2 text-center">

                <button
                  type="button"
                  onClick={async () => {

                    if (
                      resendCooldown > 0
                    ) {
                      return;
                    }

                    const pending =
                      AuthService.getPendingVerification();

                    const resend =
                      await AuthService.sendOtp({
                        role:
                          activeRole,

                        profileId:
                          pending
                            ?.profile
                            ?.id,

                        email:
                          profileForm.contactDetail,

                        fullName:
                          profileForm.fullName,
                      });

                    if (!resend?.success) {
                      setError(
                        resend?.message ||
                          "Failed to resend OTP."
                      );

                      return;
                    }

                    setResendCooldown(
                      RESEND_COOLDOWN_SECONDS
                    );
                  }}
                  disabled={
                    resendCooldown > 0
                  }
                  className="text-xs font-semibold text-pink-600 transition hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Didn't receive it? Resend OTP"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}