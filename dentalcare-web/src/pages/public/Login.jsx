import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeRole === "dentist") {
      navigate("/dentist/dashboard");
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
      navigate("/admin/dashboard");
      return;
    }
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Email
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
                  onClick={() => navigate("/")}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-md transition hover:opacity-95"
              >
                {activeRole === "dentist" ? "Dentist Login" : "Admin Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}