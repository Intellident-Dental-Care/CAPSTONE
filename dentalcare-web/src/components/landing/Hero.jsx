import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import toothImage from "../../assets/pink_tooth.png";

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="w-full overflow-x-hidden bg-[#fcf8fa] px-3 pt-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[26px] border border-pink-100/80 bg-[#fffdfd] px-4 py-4 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:rounded-[30px] sm:px-5 sm:py-5 lg:rounded-[34px] lg:px-8 lg:py-7">
        <style>
          {`
            @keyframes floatTooth {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-16px); }
            }

            @keyframes glowPulse {
              0%, 100% {
                opacity: .82;
                transform: translate(-50%, -50%) scale(1);
              }
              50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.05);
              }
            }
          `}
        </style>

        <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-[220px] w-[220px] rounded-full bg-pink-100/25 blur-3xl sm:h-[260px] sm:w-[260px]" />
        <div className="pointer-events-none absolute right-[-120px] top-[40px] h-[240px] w-[240px] rounded-full bg-rose-100/20 blur-3xl sm:h-[300px] sm:w-[300px]" />
        <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[180px] w-[420px] -translate-x-1/2 rounded-full bg-pink-100/25 blur-3xl sm:h-[220px] sm:w-[640px]" />

        {/* top bar */}
        <div className="relative z-40 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-pink-100 sm:h-12 sm:w-12">
              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold leading-none text-slate-900 sm:text-[18px]">
                GC Dental Care
              </p>
              <p className="mt-1 truncate text-[11px] font-medium text-slate-500 sm:text-[13px]">
                Powered by IntelliDent
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-11 text-[18px] font-medium text-slate-700 xl:flex">
            <a href="#about" className="transition hover:text-pink-600">
              About us
            </a>
            <a href="#services" className="transition hover:text-pink-600">
              Services
            </a>
            <a href="#specialist" className="transition hover:text-pink-600">
              Specialists
            </a>
            <a href="#contact" className="transition hover:text-pink-600">
              Contact
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login?role=dentist"
              className="rounded-full border border-pink-200 bg-white/80 px-6 py-3 text-[16px] font-medium text-pink-500 transition hover:bg-pink-50"
            >
              Dentist Login
            </Link>

            <Link
              to="/login?role=admin"
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:scale-[1.02]"
            >
              Admin Login
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-pink-200 bg-white text-xl text-pink-600 md:hidden"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="relative z-40 mt-4 rounded-[24px] border border-pink-100 bg-white p-4 shadow-[0_14px_30px_rgba(236,72,153,0.10)] md:hidden">
            <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
              <a href="#about" onClick={() => setMenuOpen(false)} className="transition hover:text-pink-600">
                About us
              </a>
              <a href="#services" onClick={() => setMenuOpen(false)} className="transition hover:text-pink-600">
                Services
              </a>
              <a href="#specialist" onClick={() => setMenuOpen(false)} className="transition hover:text-pink-600">
                Specialists
              </a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="transition hover:text-pink-600">
                Contact
              </a>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/login?role=dentist"
                className="rounded-full border border-pink-200 bg-white px-5 py-3 text-center text-sm font-medium text-pink-500 transition hover:bg-pink-50"
              >
                Dentist Login
              </Link>

              <Link
                to="/login?role=admin"
                className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)]"
              >
                Admin Login
              </Link>
            </div>
          </div>
        )}

        <div className="relative mt-8">
          {/* VERY LARGE DESKTOP ONLY */}
          <div className="hidden xl:block xl:min-h-[760px]">
            <div className="absolute left-[80px] top-[100px] z-0 w-[720px]">
              <h1 className="text-[7.4rem] font-bold leading-[0.84] tracking-[-0.1em] text-slate-900">
                Modern smiles,
                <br />
                personal care
              </h1>

              <p className="mt-12 max-w-[360px] text-[18px] leading-[1.9] text-slate-500">
                GC Dental Care offers a cleaner and more convenient dental
                experience through IntelliDent.
              </p>
            </div>

            <div
              className="pointer-events-none absolute left-1/2 top-[300px] z-0 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-pink-100/70 via-rose-100/45 to-fuchsia-100/45 blur-3xl"
              style={{ animation: "glowPulse 5s ease-in-out infinite" }}
            />

            <div className="absolute left-1/2 top-[-85px] z-20 -translate-x-1/2">
              <img
                src={toothImage}
                alt="Pink Tooth"
                className="h-[950px] max-w-none object-contain 2xl:h-[1000px]"
                style={{
                  animation: "floatTooth 5s ease-in-out infinite",
                  filter: "drop-shadow(0 42px 80px rgba(236,72,153,0.20))",
                }}
              />
            </div>

            <div className="absolute right-[50px] top-[180px] z-0 w-[720px] text-right">
              <h2 className="bg-gradient-to-b from-[#ff7cb8] via-[#ff4fa3] to-[#c400ff] bg-clip-text text-[6.8rem] font-bold leading-[0.84] tracking-[-0.1em] text-transparent">
                Smarter booking
                <br />
                made personal
              </h2>

              <p className="mt-10 ml-auto max-w-[360px] text-[18px] leading-[1.9] text-slate-500">
                Download the IntelliDent mobile app and enjoy a more organized
                way of booking.
              </p>

              <div className="mt-10 flex justify-end">
                <button className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff6b8f] px-10 py-4 text-[21px] font-semibold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)] transition hover:scale-[1.02]">
                  ↓ Download Now
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-[34px] left-1/2 z-0 w-full -translate-x-1/2 text-center">
              <p className="whitespace-nowrap bg-gradient-to-r from-pink-100/90 via-rose-100/75 to-fuchsia-100/90 bg-clip-text text-[5.4rem] font-bold tracking-[-0.06em] text-transparent">
                GC Dental Care — Modern. Clean. Personal.
              </p>
            </div>
          </div>

          {/* TABLET / SMALL LAPTOP */}
          <div className="hidden md:block xl:hidden">
            <div className="grid items-center gap-8 py-6 text-center">
              <div className="mx-auto max-w-[760px]">
                <h2 className="text-[4.1rem] font-bold leading-[0.9] tracking-[-0.08em] text-slate-900 lg:text-[5rem]">
                  <span className="whitespace-nowrap">Modern smiles,</span>
                  <br />
                  <span className="whitespace-nowrap">personal care</span>
                </h2>

                <p className="mx-auto mt-6 max-w-[480px] text-base leading-8 text-slate-500 lg:text-[18px]">
                  GC Dental Care offers a cleaner and more convenient dental
                  experience through IntelliDent.
                </p>
              </div>

              <div className="relative flex justify-center">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-pink-100/70 via-rose-100/45 to-fuchsia-100/45 blur-3xl lg:h-[420px] lg:w-[420px]"
                  style={{ animation: "glowPulse 5s ease-in-out infinite" }}
                />
                <img
                  src={toothImage}
                  alt="Pink Tooth"
                  className="relative z-10 h-[430px] w-auto object-contain lg:h-[560px]"
                  style={{
                    animation: "floatTooth 5s ease-in-out infinite",
                    filter: "drop-shadow(0 42px 80px rgba(236,72,153,0.20))",
                  }}
                />
              </div>

              <div className="mx-auto max-w-[760px]">
                <h3 className="bg-gradient-to-b from-[#ff7cb8] via-[#ff4fa3] to-[#c400ff] bg-clip-text text-[3.8rem] font-bold leading-[0.9] tracking-[-0.08em] text-transparent lg:text-[4.8rem]">
                  <span className="whitespace-nowrap">Smarter booking</span>
                  <br />
                  <span className="whitespace-nowrap">made personal</span>
                </h3>

                <p className="mx-auto mt-6 max-w-[520px] text-base leading-8 text-slate-500 lg:text-[18px]">
                  Download the IntelliDent mobile app and enjoy a more organized
                  way of booking.
                </p>

                <div className="mt-8 flex justify-center">
                  <button className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff6b8f] px-9 py-4 text-lg font-semibold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)] transition hover:scale-[1.02]">
                    ↓ Download Now
                  </button>
                </div>
              </div>

              <p className="pointer-events-none bg-gradient-to-r from-pink-100/90 via-rose-100/75 to-fuchsia-100/90 bg-clip-text text-center text-[2.8rem] font-bold tracking-[-0.06em] text-transparent lg:text-[3.4rem]">
                GC Dental Care — Modern. Clean. Personal.
              </p>
            </div>
          </div>

          {/* MOBILE */}
          <div className="md:hidden">
            <div className="grid justify-items-center gap-6 py-4 text-center sm:gap-8 sm:py-6">
              <div className="w-full max-w-[420px]">
                <h2 className="text-[2.55rem] font-bold leading-[0.88] tracking-[-0.07em] text-slate-900 sm:text-[3.4rem]">
                  <span className="whitespace-nowrap">Modern smiles,</span>
                  <br />
                  <span className="whitespace-nowrap">personal care</span>
                </h2>

                <p className="mx-auto mt-5 max-w-[340px] text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                  GC Dental Care offers a cleaner and more convenient dental
                  experience through IntelliDent.
                </p>
              </div>

              <div className="relative flex w-full justify-center">
                <div className="absolute top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-pink-100/60 blur-3xl sm:h-[320px] sm:w-[320px]" />
                <img
                  src={toothImage}
                  alt="Pink Tooth"
                  className="relative z-10 h-[270px] w-auto object-contain sm:h-[420px]"
                  style={{
                    animation: "floatTooth 5s ease-in-out infinite",
                    filter: "drop-shadow(0 28px 55px rgba(236,72,153,0.18))",
                  }}
                />
              </div>

              <div className="w-full max-w-[420px]">
                <h3 className="bg-gradient-to-b from-[#ff7cb8] via-[#ff4fa3] to-[#c400ff] bg-clip-text text-[2.2rem] font-bold leading-[0.88] tracking-[-0.07em] text-transparent sm:text-[3rem]">
                  <span className="whitespace-nowrap">Smarter booking</span>
                  <br />
                  <span className="whitespace-nowrap">made personal</span>
                </h3>

                <p className="mx-auto mt-5 max-w-[340px] text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
                  Download the IntelliDent mobile app and enjoy a more organized
                  way of booking.
                </p>

                <div className="mt-6 flex justify-center">
                  <button className="rounded-full bg-gradient-to-r from-[#ff4fa3] to-[#ff6b8f] px-7 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)] transition hover:scale-[1.02] sm:px-8 sm:py-4 sm:text-lg">
                    ↓ Book Now
                  </button>
                </div>
              </div>

              <p className="pointer-events-none bg-gradient-to-r from-pink-100/90 via-rose-100/75 to-fuchsia-100/90 bg-clip-text text-center text-[1.7rem] font-bold leading-tight tracking-tight text-transparent sm:text-[2.4rem]">
                GC Dental Care — Modern. Clean. Personal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}