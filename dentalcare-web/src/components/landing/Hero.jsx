import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import toothImage from "../../assets/pink_tooth.png";

export default function Hero() {
  return (
    <section className="w-full bg-[#fcf8fa] px-3 pt-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[34px] border border-pink-100/80 bg-[#fffdfd] px-6 py-6 lg:px-8 lg:py-7 shadow-[0_18px_60px_rgba(236,72,153,0.08)]">
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

        {/* soft background accents */}
        <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-pink-100/25 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[40px] h-[300px] w-[300px] rounded-full bg-rose-100/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[220px] w-[640px] -translate-x-1/2 rounded-full bg-pink-100/25 blur-3xl" />

        {/* top bar */}
        <div className="relative z-40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-pink-50 ring-1 ring-pink-100">
              <img
                src={logo}
                alt="GC Dental Care Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-[18px] font-bold leading-none text-slate-900">
                GC Dental Care
              </p>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Powered by IntelliDent
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-11 text-[18px] font-medium text-slate-700">
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

          <div className="flex items-center gap-3">
            <Link
              to="/login?role=dentist"
              className="hidden rounded-full border border-pink-200 bg-white/80 px-6 py-3 text-[16px] font-medium text-pink-500 transition hover:bg-pink-50 sm:block"
            >
              Dentist Login
            </Link>

            <Link
              to="/login?role=admin"
              className="rounded-full bg-gradient-to-r from-pink-500  to-rose-400 px-6 py-3 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(236,72,153,0.22)] transition hover:scale-[1.02]"
            >
              Admin Login
            </Link>
          </div>
        </div>

        <div className="relative mt-8 lg:min-h-[760px]">
          {/* DESKTOP */}
          <div className="hidden lg:block">
            {/* left content */}
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

            {/* center glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-[300px] z-0 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-pink-100/70 via-rose-100/45 to-fuchsia-100/45 blur-3xl"
              style={{ animation: "glowPulse 5s ease-in-out infinite" }}
            />

            {/* tooth */}
            <div className="absolute left-1/2 top-[-85px] z-20 -translate-x-1/2">
              <img
                src={toothImage}
                alt="Pink Tooth"
                className="h-[950px] xl:h-[1000px] max-w-none object-contain"
                style={{
                  animation: "floatTooth 5s ease-in-out infinite",
                  filter: "drop-shadow(0 42px 80px rgba(236,72,153,0.20))",
                }}
              />
            </div>

            {/* right content */}
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
                <button className="rounded-full bg-gradient-to-r from-[#ff4fa3]  to-[#ff6b8f] px-10 py-4 text-[21px] font-semibold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)] transition hover:scale-[1.02]">
                  ↓   Download Now
                </button>
              </div>
            </div>

            {/* bottom faded text */}
            <div className="pointer-events-none absolute bottom-[34px] left-1/2 z-0 w-full -translate-x-1/2 text-center">
              <p className="whitespace-nowrap bg-gradient-to-r from-pink-100/90 via-rose-100/75 to-fuchsia-100/90 bg-clip-text text-[5.4rem] font-bold tracking-[-0.06em] text-transparent">
                GC Dental Care — Modern. Clean. Personal.
              </p>
            </div>
          </div>

          {/* MOBILE / TABLET */}
          <div className="lg:hidden">
            <div className="grid items-center gap-8">
              <div>
                <h2 className="text-5xl font-bold leading-[0.9] tracking-[-0.05em] text-slate-900 sm:text-6xl">
                  Modern smiles,
                  <br />
                  personal care
                </h2>

                <p className="mt-6 max-w-[340px] text-base leading-8 text-slate-500">
                  GC Dental Care offers a cleaner and more convenient dental
                  experience through IntelliDent.
                </p>
              </div>

              <div className="relative flex justify-center">
                <div className="absolute top-1/2 h-[260px] w-[260px] -translate-y-1/2 rounded-full bg-pink-100/60 blur-3xl sm:h-[320px] sm:w-[320px]" />
                <img
                  src={toothImage}
                  alt="Pink Tooth"
                  className="relative z-10 h-[430px] w-auto object-contain sm:h-[520px]"
                  style={{
                    animation: "floatTooth 5s ease-in-out infinite",
                    filter: "drop-shadow(0 28px 55px rgba(236,72,153,0.18))",
                  }}
                />
              </div>

              <div>
                <h3 className="bg-gradient-to-b from-[#ff7cb8] via-[#ff4fa3] to-[#c400ff] bg-clip-text text-5xl font-bold leading-[0.9] tracking-[-0.06em] text-transparent sm:text-6xl">
                  Smarter booking
                  <br />
                  made personal
                </h3>

                <p className="mt-6 max-w-[360px] text-base leading-8 text-slate-500">
                  Download the IntelliDent mobile app and enjoy a more
                  organized way of booking.
                </p>

                <div className="mt-8">
                  <button className="rounded-full bg-gradient-to-r from-[#ff4fa3] via-[#f339b5] to-[#ff6b8f] px-8 py-4 text-lg font-semibold text-white shadow-[0_16px_28px_rgba(236,72,153,0.24)]">
                    ↓ Book Now
                  </button>
                </div>
              </div>

              <p className="pointer-events-none bg-gradient-to-r from-pink-100/90 via-rose-100/75 to-fuchsia-100/90 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                GC Dental Care — Modern. Clean. Personal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 