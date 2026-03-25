import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

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

    console.log({
      role: activeRole,
      email,
      password,
      saveUser,
    });

     if (activeRole === "dentist") {
      navigate("/dentist/dashboard");
    } else if (activeRole === "admin") {
      navigate("/admin/dashboard");
  }
};

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_#ffd8e8,_#fff4f8_35%,_#ffffff_70%)] p-3 sm:p-4 lg:p-6">
      <div className="grid min-h-[calc(100vh-24px)] overflow-hidden rounded-[34px] border border-pink-200/70 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.12)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-pink-500 via-rose-400 to-pink-300 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute left-8 top-8 grid grid-cols-5 gap-2 opacity-25">
            {Array.from({ length: 25 }).map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-white"
              />
            ))}
          </div>

          <div className="absolute bottom-10 right-10 grid grid-cols-5 gap-2 opacity-15">
            {Array.from({ length: 25 }).map((_, i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-white"
              />
            ))}
          </div>

          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 font-bold text-white backdrop-blur-sm">
                GC
              </div>

              <div>
                <h1 className="text-base font-bold">GC Dental Care</h1>
                <p className="text-sm text-pink-50/90">Powered by IntelliDent</p>
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-5xl font-bold leading-tight">
              IntelliDent
              <br />
              Login Portal
            </h2>

            <ul className="mt-10 space-y-5 text-lg">
              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  1
                </span>
                Appointment Monitoring
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  2
                </span>
                Patient Record Access
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  3
                </span>
                Clinic Schedule Management
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  4
                </span>
                Role-Based Dashboard
              </li>

              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  5
                </span>
                Organized Dental Workflow
              </li>
            </ul>
          </div>

          <div className="relative z-10 text-sm text-pink-50/90">
            Secure access for dentists and administrators
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#fffafb] px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 font-bold text-white shadow-md">
                  GC
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
              <h3 className="text-4xl font-bold text-slate-900">Login</h3>
              <p className="mt-2 text-sm text-slate-500">
                Access the IntelliDent dashboard
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
                  type="email"
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
