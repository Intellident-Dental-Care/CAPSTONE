import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthService from "../../services/authService";
import { preloadAdminData } from "../../services/adminService";
import { preloadDentistData } from "../../services/dentistService";
import logo from "../../assets/logo.png";
import clinicImage from "../../assets/picture4.png";

export default function Login() {
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
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    otp: "",
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
    () => Array.from({ length: 100 }, (_, i) => String(currentYear - i)),
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
    const daysInMonth = monthIndex ? new Date(year, monthIndex, 0).getDate() : 31;

    return Array.from({ length: daysInMonth }, (_, i) =>
      String(i + 1).padStart(2, "0")
    );
  }, [currentYear, dobParts.month, dobParts.year]);

  const normalizePhoneNumber = (value) =>
    (value || "").replace(/\D/g, "").slice(-10);

  useEffect(() => {
    AuthService.clearPendingVerification();
  }, []);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
  };

  const applyPendingVerification = (role, profile) => {
    const dobVal = profile?.dob || "";
    const [y = "", m = "", d = ""] = dobVal.split("-");

    setActiveRole(role);
    setDobParts({ year: y, month: m, day: d });
    setProfileForm({
      fullName: profile?.fullName || profile?.name || "",
      phone: normalizePhoneNumber(profile?.phone || profile?.phone_number || ""),
      dob: dobVal,
      gender: profile?.gender || "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowVerifyModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      return setError("Required email/password");
    }

    try {
      setLoading(true);

      const res =
        activeRole === "admin"
          ? await AuthService.adminLogin(email, password)
          : await AuthService.dentistLogin(email, password);

      if (!res?.success) {
        return setError(res?.message || "Login failed");
      }

      if (res?.requiresVerification) {
        return applyPendingVerification(activeRole, res?.data?.profile);
      }

      if (activeRole === "admin") {
        await preloadAdminData();

        const data = res?.data?.admin || {};
        if (
          data.admin_type === "super_admin" ||
          data.adminType === "super_admin"
        ) {
          navigate("/superadmin/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        await preloadDentistData();
        navigate("/dentist/dashboard", { replace: true });
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    setError("");

    if (!profileForm.fullName || !profileForm.otp || !profileForm.newPassword) {
      return setError("Fill all fields");
    }

    if (profileForm.newPassword !== profileForm.confirmPassword) {
      return setError("Passwords mismatch");
    }

    if (!dobParts.year || !dobParts.month || !dobParts.day) {
      return setError("Please complete your date of birth");
    }

    setSavingProfile(true);

    try {
      const payload = {
        ...profileForm,
        phone: `+63${normalizePhoneNumber(profileForm.phone)}`,
        dob: `${dobParts.year}-${dobParts.month}-${dobParts.day}`,
        contactDetail: email,
      };

      const saveRes = await AuthService.completeProfile(payload);

      if (!saveRes?.success) {
        return setError(saveRes?.message || "Update failed");
      }

      const pending = AuthService.getPendingVerification();

      const verifyRes = await AuthService.verifyOtp(profileForm.otp, {
        role: activeRole,
        profileId: pending?.profile?.id,
        email,
      });

      if (!verifyRes?.success) {
        return setError(verifyRes?.message || "Invalid OTP code");
      }

      setShowVerifyModal(false);

      if (activeRole === "admin") {
        await preloadAdminData();

        const profile = verifyRes?.data?.profile || {};
        if (
          profile.admin_type === "super_admin" ||
          profile.adminType === "super_admin"
        ) {
          navigate("/superadmin/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        await preloadDentistData();
        navigate("/dentist/dashboard", { replace: true });
      }
    } catch (err) {
      setError("Setup failed");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffe3ee,_#fff7fa_34%,_#ffffff_72%)] p-3 sm:p-4 lg:p-6">
      <div className="grid h-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.12)] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="relative hidden overflow-hidden lg:flex">
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
            className="absolute inset-0 h-full w-full object-cover object-[9%_center]"
            style={{ animation: "slowZoom 6s ease-in-out infinite" }}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/70 via-pink-100/40 to-white/10" />
          <div className="absolute inset-0 bg-slate-900/10" />

          <div
            className="absolute left-[-80px] top-[-80px] h-[260px] w-[260px] rounded-full bg-pink-300/40 blur-3xl"
            style={{ animation: "floatGlow 8s infinite" }}
          />
          <div
            className="absolute bottom-[-100px] right-[-60px] h-[260px] w-[260px] rounded-full bg-rose-200/40 blur-3xl"
            style={{ animation: "floatGlow 10s infinite" }}
          />

          <div className="relative z-20 flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-12 rounded-2xl bg-white/80 p-1"
              />
              <div>
                <h1 className="font-bold text-white">GC Dental Care</h1>
                <p className="text-sm text-white/80">Powered by IntelliDent</p>
              </div>
            </div>

            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                Secure Access
              </div>

              <p className="max-w-md text-[17px] leading-7 text-white/90">
                Access your dashboard and manage appointments with a smoother,
                more organized experience.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#fffafb] px-6 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <h2 className="font-bold text-slate-900">GC Dental Care</h2>
            </div>

            <h3 className="text-4xl font-bold tracking-[-0.04em] text-slate-900">
              Login
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your dashboard
            </p>

            <div className="mt-8 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-pink-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("dentist")}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${
                    activeRole === "dentist"
                      ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white"
                      : "text-slate-600 hover:bg-pink-50"
                  }`}
                >
                  Dentist Login
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("admin")}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${
                    activeRole === "admin"
                      ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white"
                      : "text-slate-600 hover:bg-pink-50"
                  }`}
                >
                  Admin Login
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <input
                type="text"
                placeholder="youremail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100"
              />

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveUser}
                    onChange={(e) => setSaveUser(e.target.checked)}
                  />
                  Save User
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-pink-600"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3 font-bold uppercase tracking-[0.18em] text-white"
              >
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-[2px]">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-pink-100 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="grid min-h-[720px] lg:grid-cols-[0.85fr_1.15fr]">
              {/* LEFT SIDE */}
              <div className="relative hidden overflow-hidden bg-gradient-to-br from-pink-500 via-rose-400 to-pink-300 p-10 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
                  <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-white blur-3xl" />
                </div>

                <div className="relative z-10">
                  <div className="mb-6 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-sm">
                    First Time Access
                  </div>

                  <h3 className="max-w-xs text-5xl font-bold leading-[1.05] text-white">
                    Complete your account setup
                  </h3>

                  <p className="mt-6 max-w-sm text-base leading-8 text-white/90">
                    Fill in your details, enter the invitation OTP, and create your
                    password to continue to your dashboard.
                  </p>
                </div>

                <div className="relative z-10 rounded-[24px] border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                    Quick Reminder
                  </p>
                  <p className="mt-3 text-base leading-8 text-white">
                    Use the OTP sent to your invitation email and make sure your
                    password entries match before continuing.
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="max-h-[90vh] overflow-y-auto px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="mb-8 md:hidden">
                  <div className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-600">
                    First Time Access
                  </div>
                  <h3 className="mt-3 text-3xl font-bold text-slate-900">
                    Complete your account setup
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your details and the OTP from your invitation email.
                  </p>
                </div>

                <div className="mb-8 hidden md:block">
                  <p className="text-sm font-medium text-pink-500">Account Setup</p>
                  <h3 className="mt-1 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                    Welcome to GC Dental Care
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
                    Please complete the required information below before logging in.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, fullName: e.target.value })
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Mobile Number
                      </label>
                      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-pink-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-pink-100">
                        <span className="flex items-center border-r border-slate-200 px-5 text-sm font-semibold text-slate-500">
                          +63
                        </span>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="9XXXXXXXXX"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: normalizePhoneNumber(e.target.value),
                            })
                          }
                          className="w-full bg-transparent px-5 py-4 text-[15px] text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Gender
                      </label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, gender: e.target.value })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date of Birth
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <select
                        value={dobParts.month}
                        onChange={(e) =>
                          setDobParts({ ...dobParts, month: e.target.value })
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      >
                        <option value="">Month</option>
                        {monthOptions.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={dobParts.day}
                        onChange={(e) =>
                          setDobParts({ ...dobParts, day: e.target.value })
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      >
                        <option value="">Day</option>
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={dobParts.year}
                        onChange={(e) =>
                          setDobParts({ ...dobParts, year: e.target.value })
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      >
                        <option value="">Year</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Invitation OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={profileForm.otp}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          otp: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full rounded-2xl border border-pink-200 bg-pink-50 px-5 py-4 text-center text-lg font-bold tracking-[0.35em] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="Create password"
                        value={profileForm.newPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={profileForm.confirmPassword}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] text-slate-800 outline-none transition focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCompleteSetup}
                    disabled={savingProfile}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(236,72,153,0.28)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingProfile ? "Please wait..." : "Complete Setup & Login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}