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

  const monthOptions = useMemo(() => [
    { value: "01", label: "January" }, { value: "02", label: "February" }, { value: "03", label: "March" },
    { value: "04", label: "April" }, { value: "05", label: "May" }, { value: "06", label: "June" },
    { value: "07", label: "July" }, { value: "08", label: "August" }, { value: "09", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
  ], []);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => Array.from({ length: 100 }, (_, i) => String(currentYear - i)), [currentYear]);
  const [dobParts, setDobParts] = useState({ year: "", month: "", day: "" });

  const dayOptions = useMemo(() => {
    const year = Number(dobParts.year) || currentYear;
    const monthIndex = Number(dobParts.month);
    const daysInMonth = monthIndex ? new Date(year, monthIndex, 0).getDate() : 31;
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [currentYear, dobParts.month, dobParts.year]);

  const normalizePhoneNumber = (value) => {
    let digits = (value || "").replace(/\D/g, "");
    if (digits.startsWith("63")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
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
    const dobVal = profile?.dob || "";
    const [y = "", m = "", d = ""] = dobVal.split("-");
    setActiveRole(role);
    setDobParts({ year: y, month: m, day: d });
    setProfileForm({
      fullName: profile?.fullName || profile?.name || "",
      phone: normalizePhoneNumber(profile?.phone || profile?.phone_number || ""),
      dob: dobVal,
      gender: profile?.gender || "",
      contactDetail: profile?.contact_detail || profile?.contactDetail || profile?.email || email || "",
      otp: "",
      newPassword: "",
      confirmPassword: ""
    });
    setVerificationStep("profile");
    setShowVerifyModal(true);
  };

  useEffect(() => { AuthService.clearPendingVerification(); }, []);

  useEffect(() => {
    if (verificationStep !== "otp" || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationStep, resendCooldown]);

  const handleCloseVerificationModal = () => {
    setShowVerifyModal(false);
    setVerificationStep("profile");
    setProfileForm((prev) => ({ ...prev, otp: "" }));
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
    if (!email || !password) return setError("Required email/password");
    
    try {
      setLoading(true);
      const res = activeRole === "admin" 
        ? await AuthService.adminLogin(email, password) 
        : await AuthService.dentistLogin(email, password);
        
      if (!res?.success) return setError(res?.message || "Login failed");
      
      if (res?.requiresVerification) return applyPendingVerification(activeRole, res?.data?.profile);

      if (activeRole === "admin") {
        await preloadAdminData();
        const data = res?.data?.admin || {};
        if (data.admin_type === "super_admin" || data.adminType === "super_admin") {
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

  const handleProfileSaveAndSendOtp = async () => {
    setError("");
    if (!profileForm.fullName || !profileForm.phone || !profileForm.contactDetail) {
      return setError("Full name, contact number, and email are required.");
    }

    const localPhone = normalizePhoneNumber(profileForm.phone);
    if (localPhone.length < 10) return setError("Please enter a valid contact number.");

    if (profileForm.newPassword || profileForm.confirmPassword) {
      if (!profileForm.newPassword || !profileForm.confirmPassword) return setError("Please complete both password fields.");
      if (profileForm.newPassword !== profileForm.confirmPassword) return setError("Passwords mismatch");
      if (profileForm.newPassword.length < 8) return setError("Password must be at least 8 characters.");
    }

    setSavingProfile(true);
    try {
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

      const saveResult = await AuthService.completeProfile(payload);
      if (!saveResult?.success) {
        return setError(saveResult?.message || "Failed to update profile.");
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
        return setError(otpResult?.message || "Failed to send OTP.");
      }

      setVerificationStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError("Setup failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!profileForm.otp || profileForm.otp.length !== 6) return setError("Enter the 6-digit OTP.");

    const pending = AuthService.getPendingVerification();
    const result = await AuthService.verifyOtp(profileForm.otp, {
      role: activeRole,
      profileId: pending?.profile?.id,
      email: profileForm.contactDetail?.trim(),
    });
    
    if (!result?.success) return setError(result?.message || "Invalid OTP code.");

    setShowVerifyModal(false);

    if (activeRole === "admin") {
      await preloadAdminData();
      const userProfile = result.data?.profile || AuthService.getCurrentUser() || {};
      if (userProfile?.admin_type === "super_admin" || userProfile?.adminType === "super_admin") {
        navigate("/superadmin/dashboard", { replace: true });
      } else {
        navigate("/admin/dashboard", { replace: true });
      }
    } else {
      await preloadDentistData();
      navigate("/dentist/dashboard", { replace: true });
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffe3ee,_#fff7fa_34%,_#ffffff_72%)] p-3 sm:p-4 lg:p-6">
      <div className="grid h-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow lg:grid-cols-[1.03fr_0.97fr]">
        
        <div className="relative hidden h-full overflow-hidden lg:flex">
          <style>{`@keyframes slowZoom {0%,100%{transform:scale(1)}50%{transform:scale(1.04)}} @keyframes floatGlow {0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-15px)}}`}</style>
          <img src={clinicImage} alt="Clinic" className="absolute inset-0 h-full w-full object-cover" style={{ animation: "slowZoom 5s infinite", objectPosition: "10%" }} />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-200/72 via-pink-100/42 to-white/10" />
          <div className="absolute inset-0 bg-slate-900/12" />
          <div className="relative z-20 flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-12 w-12 bg-white/80 rounded-2xl p-1" />
              <div><h1 className="font-bold text-white">GC Dental Care</h1><p className="text-xs text-white/80">Powered by IntelliDent</p></div>
            </div>
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">Secure Access</div>
              <p className="text-white/92 max-w-md">Manage your appointments with a smoother experience.</p>
            </div>
          </div>
        </div>

        <div className="flex h-full items-center justify-center bg-[#fffafb] px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <div><h2 className="font-bold text-slate-900">GC Dental Care</h2></div>
            </div>
            <h3 className="text-4xl font-bold text-slate-900">Login</h3>
            
            <div className="mt-8 grid grid-cols-2 gap-2 bg-white p-2 rounded-2xl ring-1 ring-pink-100">
              <button onClick={() => handleRoleChange("dentist")} className={`rounded-xl py-3 text-sm font-semibold transition ${activeRole === "dentist" ? "bg-pink-500 text-white shadow" : "text-slate-600"}`}>Dentist</button>
              <button onClick={() => handleRoleChange("admin")} className={`rounded-xl py-3 text-sm font-semibold transition ${activeRole === "admin" ? "bg-pink-500 text-white shadow" : "text-slate-600"}`}>Admin</button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
              <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100" />
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={saveUser} onChange={(e) => setSaveUser(e.target.checked)} className="accent-pink-500" /> Save User
                </label>
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm font-semibold text-pink-600">Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3 text-white font-bold uppercase tracking-widest">
                {loading ? "Wait..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {verificationStep === "profile" ? "Account Setup" : "Verify Your Email"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {verificationStep === "profile" 
                    ? "Enter your details to complete your profile." 
                    : "Enter the OTP sent to your email to activate your account."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseVerificationModal}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-pink-100 text-slate-500 hover:bg-pink-50"
              >
                X
              </button>
            </div>

            {verificationStep === "profile" ? (
              <div className="mt-6 space-y-4">
                <input type="text" placeholder="Full Name" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} className="w-full rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
                
                <div className="flex items-center gap-2 rounded-xl border border-pink-100 px-3 py-2 focus-within:border-pink-300">
                  <span className="text-sm font-semibold text-pink-700">+63</span>
                  <input type="tel" placeholder="9XX XXX XXXX" value={formatLocalPhone(profileForm.phone)} onChange={(e) => setProfileForm({...profileForm, phone: normalizePhoneNumber(e.target.value)})} className="w-full border-none bg-transparent outline-none text-sm" />
                </div>

                <select value={profileForm.gender} onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})} className="w-full rounded-xl border border-pink-100 px-3 py-2 text-sm outline-none focus:border-pink-300">
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <div className="grid grid-cols-2 gap-4">
                  <input type="password" placeholder="New Password" value={profileForm.newPassword} onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})} className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
                  <input type="password" placeholder="Confirm" value={profileForm.confirmPassword} onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})} className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <select value={dobParts.month} onChange={(e) => setDobParts({...dobParts, month: e.target.value})} className="border border-pink-100 rounded-xl p-2 text-sm outline-none focus:border-pink-300">
                    <option value="">Month</option>{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select value={dobParts.day} onChange={(e) => setDobParts({...dobParts, day: e.target.value})} className="border border-pink-100 rounded-xl p-2 text-sm outline-none focus:border-pink-300"><option value="">Day</option>{dayOptions.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={dobParts.year} onChange={(e) => setDobParts({...dobParts, year: e.target.value})} className="border border-pink-100 rounded-xl p-2 text-sm outline-none focus:border-pink-300"><option value="">Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                
                <button onClick={handleProfileSaveAndSendOtp} disabled={savingProfile} className="w-full rounded-xl bg-pink-500 py-3 text-white font-bold uppercase shadow-lg transition active:scale-95 disabled:opacity-70">
                  {savingProfile ? "Wait..." : "Save Profile & Send OTP"}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {profileForm.contactDetail && (
                  <p className="text-xs font-medium text-pink-700">
                    OTP recipient: {profileForm.contactDetail}
                  </p>
                )}
                <input type="text" maxLength={6} placeholder="Enter 6-digit OTP" value={profileForm.otp} onChange={(e) => setProfileForm({...profileForm, otp: e.target.value.replace(/\D/g, "")})} className="w-full rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 font-bold tracking-[0.3em] outline-none text-center" />
                
                <button onClick={handleVerifyOtp} className="w-full rounded-xl bg-pink-500 py-3 text-white font-bold uppercase shadow-lg transition active:scale-95">
                  Verify & Login
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    if (resendCooldown > 0) return;
                    const pending = AuthService.getPendingVerification();
                    const resend = await AuthService.sendOtp({ role: activeRole, profileId: pending?.profile?.id, email: profileForm.contactDetail, fullName: profileForm.fullName });
                    if (!resend?.success) {
                      setError(resend?.message || "Failed to resend OTP.");
                      return;
                    }
                    setResendCooldown(RESEND_COOLDOWN_SECONDS);
                  }}
                  disabled={resendCooldown > 0}
                  className="w-full rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-600 disabled:opacity-60"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}