import { Link } from "react-router-dom";
import heroImage from "../../assets/hero.png";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffd6e5,_#fff1f7_35%,_#fff_70%)] px-3 pt-3 sm:px-4 lg:px-6"
    >
      <div className="absolute left-[-120px] top-[-80px] h-80 w-80 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-100px] h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative flex min-h-[calc(100vh-24px)] w-full flex-col rounded-[34px] border border-pink-200/70 bg-white shadow-[0_22px_70px_rgba(236,72,153,0.12)]">
        <header className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 font-bold text-white shadow-md">
                GC
              </div>

              <div className="leading-tight">
                <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                  GC Dental Care
                </h1>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Powered by IntelliDent
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-7 lg:flex">
              <a href="#about" className="text-sm font-medium text-slate-700 hover:text-pink-600">
                About us
              </a>
              <a href="#services" className="text-sm font-medium text-slate-700 hover:text-pink-600">
                Services
              </a>
              <a href="#specialist" className="text-sm font-medium text-slate-700 hover:text-pink-600">
                Specialist
              </a>
              <a href="#overview" className="text-sm font-medium text-slate-700 hover:text-pink-600">
                Application Overview
              </a>
              <a href="#contact" className="text-sm font-medium text-slate-700 hover:text-pink-600">
                Contact
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login?role=dentist"
                className="hidden rounded-full border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50 sm:inline-flex"
                >
                Dentist Login
              </Link>

              <Link
                to="/login?role=admin"
                className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95 sm:px-5 sm:text-sm"
                >
                Admin Login
              </Link>
            </div>
          </nav>
        </header>

        <div className="flex flex-1 items-center px-5 pb-8 pt-2 sm:px-8 sm:pb-10 lg:px-10 lg:pb-12 xl:px-12">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="order-2 lg:order-1">
              <p className="inline-flex rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600 sm:text-sm">
                Premium Dental Experience
              </p>

              <h2 className="mt-5 max-w-4xl text-4xl font-bold leading-[0.95] tracking-tight text-slate-900 sm:text-5xl lg:text-7xl xl:text-8xl">
                Modern smiles,
                <br />
                personal care,
                <br />
                <span className="bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
                  smarter booking
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
                GC Dental Care offers a more organized and convenient patient
                experience through IntelliDent — from mobile appointment booking
                to smoother clinic-side management for dentists and admins.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#services"
                  className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
                >
                  View Services
                </a>

                <a
                  href="#about"
                  className="rounded-full border border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
                >
                  About Us
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] bg-pink-50 p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">24/7</p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Digital Booking
                  </p>
                </div>

                <div className="rounded-[24px] bg-pink-50 p-4 shadow-sm">
                  <p className="text-2xl font-bold text-slate-900">Easy</p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Appointment Flow
                  </p>
                </div>

                <div className="col-span-2 rounded-[24px] bg-pink-50 p-4 shadow-sm sm:col-span-1">
                  <p className="text-2xl font-bold text-slate-900">Smart</p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Clinic Dashboard
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto max-w-xl">
                <div className="absolute left-0 top-6 hidden rounded-[24px] border border-pink-100 bg-white/95 p-4 shadow-lg md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                    Appointment
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Mobile booking made easier
                  </p>
                </div>

                <div className="absolute bottom-8 right-0 hidden rounded-[24px] border border-pink-100 bg-white/95 p-4 shadow-lg md:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                    Dashboard
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Better clinic management
                  </p>
                </div>

                <div className="overflow-hidden rounded-[34px] bg-gradient-to-br from-pink-100 via-rose-50 to-white p-3 shadow-[0_22px_60px_rgba(236,72,153,0.18)]">
                  <img
                    src={heroImage}
                    alt="GC Dental Care Hero"
                    className="h-[320px] w-full rounded-[28px] object-cover sm:h-[430px] lg:h-[620px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}