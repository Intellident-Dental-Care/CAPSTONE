import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
    fullName: "", phone: "", dob: "", gender: "", otp: "", newPassword: "", confirmPassword: ""
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

  const normalizePhoneNumber = (v) => (v || "").replace(/\D/g, "").slice(-10);

  const applyPendingVerification = (role, profile) => {
    const dobVal = profile?.dob || "";
    const [y = "", m = "", d = ""] = dobVal.split("-");
    setActiveRole(role);
    setDobParts({ year: y, month: m, day: d });
    setProfileForm({
      fullName: profile?.fullName || profile?.name || "",
      phone: normalizePhoneNumber(profile?.phone || profile?.phone_number || ""),
      dob: dobVal, gender: profile?.gender || "", otp: "", newPassword: "", confirmPassword: ""
    });
    setShowVerifyModal(true);
  };

  useEffect(() => { AuthService.clearPendingVerification(); }, []);

  const handleRoleChange = (role) => { setActiveRole(role); setSearchParams({ role }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Required email/password");
    try {
      setLoading(true);
      const res = activeRole === "admin" ? await AuthService.adminLogin(email, password) : await AuthService.dentistLogin(email, password);
      if (!res?.success) return setError(res?.message || "Login failed");
      
      if (res?.requiresVerification) return applyPendingVerification(activeRole, res?.data?.profile);

      if (activeRole === "admin") {
        await preloadAdminData();
        const data = res?.data?.admin || {};
        // Check for super_admin type to determine dashboard path
        if (data.admin_type === "super_admin" || data.adminType === "super_admin") {
          navigate("/superadmin/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        await preloadDentistData();
        navigate("/dentist/dashboard", { replace: true });
      }
    } catch (err) { setError("An error occurred"); } finally { setLoading(false); }
  };

  const handleCompleteSetup = async () => {
    setError("");
    if (!profileForm.fullName || !profileForm.otp || !profileForm.newPassword) return setError("Fill all fields");
    if (profileForm.newPassword !== profileForm.confirmPassword) return setError("Passwords mismatch");

    setSavingProfile(true);
    try {
      const payload = { ...profileForm, phone: `+63${normalizePhoneNumber(profileForm.phone)}`, dob: `${dobParts.year}-${dobParts.month}-${dobParts.day}`, contactDetail: email };
      const saveRes = await AuthService.completeProfile(payload);
      if (!saveRes?.success) return setError(saveRes?.message || "Update failed");

      const pending = AuthService.getPendingVerification();
      const verifyRes = await AuthService.verifyOtp(profileForm.otp, { role: activeRole, profileId: pending?.profile?.id, email });
      if (!verifyRes?.success) return setError("Invalid OTP code");

      setShowVerifyModal(false);
      
      if (activeRole === "admin") {
        await preloadAdminData();
        const profile = verifyRes.data?.profile || {};
        // Use verified profile to decide correct dashboard
        if (profile.admin_type === "super_admin" || profile.adminType === "super_admin") {
          navigate("/superadmin/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      } else {
        await preloadDentistData();
        navigate("/dentist/dashboard", { replace: true });
      }
    } catch (err) { setError("Setup failed"); } finally { setSavingProfile(false); }
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
            <div><div className="mb-5 inline-flex rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">Secure Access</div><p className="text-white/92 max-w-md">Manage your appointments with a smoother experience.</p></div>
          </div>
        </div>

        <div className="flex h-full items-center justify-center bg-[#fffafb] px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3"><img src={logo} alt="Logo" className="h-10 w-10" /><div><h2 className="font-bold text-slate-900">GC Dental Care</h2></div></div>
            <h3 className="text-4xl font-bold text-slate-900">Login</h3>
            <div className="mt-8 grid grid-cols-2 gap-2 bg-white p-2 rounded-2xl ring-1 ring-pink-100">
              <button onClick={() => handleRoleChange("dentist")} className={`rounded-xl py-3 text-sm font-semibold transition ${activeRole === "dentist" ? "bg-pink-500 text-white shadow" : "text-slate-600"}`}>Dentist</button>
              <button onClick={() => handleRoleChange("admin")} className={`rounded-xl py-3 text-sm font-semibold transition ${activeRole === "admin" ? "bg-pink-500 text-white shadow" : "text-slate-600"}`}>Admin</button>
            </div>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
              <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none focus:ring-2 focus:ring-pink-100" />
              <div className="flex justify-between items-center"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={saveUser} onChange={(e) => setSaveUser(e.target.checked)} className="accent-pink-500" /> Save User</label><button type="button" onClick={() => navigate("/forgot-password")} className="text-sm font-semibold text-pink-600">Forgot Password?</button></div>
              <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 py-3 text-white font-bold uppercase tracking-widest">{loading ? "Wait..." : "Login"}</button>
            </form>
          </div>
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900">Account Setup</h3>
            <p className="text-sm text-slate-500 mt-1">Enter your details and the OTP from your invitation email.</p>
            <div className="mt-6 space-y-4">
              <input type="text" placeholder="Full Name" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} className="w-full rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
              <input type="text" maxLength={6} placeholder="Invitation OTP Code" value={profileForm.otp} onChange={(e) => setProfileForm({...profileForm, otp: e.target.value.replace(/\D/g, "")})} className="w-full rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 font-bold tracking-[0.3em] outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="password" placeholder="New Password" value={profileForm.newPassword} onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})} className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
                <input type="password" placeholder="Confirm" value={profileForm.confirmPassword} onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})} className="rounded-xl border border-pink-100 px-3 py-2 outline-none focus:border-pink-300" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={dobParts.month} onChange={(e) => setDobParts({...dobParts, month: e.target.value})} className="border rounded p-2 text-sm outline-none">
                  <option value="">Month</option>{monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={dobParts.day} onChange={(e) => setDobParts({...dobParts, day: e.target.value})} className="border rounded p-2 text-sm outline-none"><option value="">Day</option>{dayOptions.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select value={dobParts.year} onChange={(e) => setDobParts({...dobParts, year: e.target.value})} className="border rounded p-2 text-sm outline-none"><option value="">Year</option>{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
              <button onClick={handleCompleteSetup} disabled={savingProfile} className="w-full rounded-xl bg-pink-500 py-3 text-white font-bold uppercase shadow-lg transition active:scale-95">
                {savingProfile ? "Wait..." : "Complete Setup & Login"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}