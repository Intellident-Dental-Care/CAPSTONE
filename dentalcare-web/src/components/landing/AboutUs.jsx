import logo from "../../assets/logo.png";
import picture1 from "../../assets/picture1.png";
import picture2 from "../../assets/picture2.jpg";
import picture3 from "../../assets/picture3.png";
import picture4 from "../../assets/picture4.png";

export default function AboutUs() {
  return (
    <section id="about" className="w-full px-3 pb-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[34px] border border-pink-100/80 bg-[#fffdfd] px-6 py-8 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:px-8 lg:px-10 lg:py-10">

        {/* glow */}
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[220px] w-[220px] rounded-full bg-pink-100/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-rose-100/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[240px] w-[520px] -translate-x-1/2 rounded-full bg-pink-100/20 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">

          {/* ================= LEFT SIDE ================= */}
          <div className="flex flex-col h-full gap-5">

            {/* TOP IMAGE (NOW FLEXIBLE HEIGHT) */}
            <div className="group relative flex-1 overflow-hidden rounded-[30px] border border-pink-100 bg-white shadow-[0_14px_34px_rgba(236,72,153,0.08)]">
              <img
                src={picture4}
                alt="GC Dental Care clinic"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-white/5" />

              {/* logo badge only */}
              <div className="absolute left-5 top-5 flex items-center gap-3 rounded-full border border-white/40 bg-white/75 px-4 py-2 backdrop-blur-md">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-pink-50">
                  <img
                    src={logo}
                    alt="GC Dental Care Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    GC Dental Care
                  </p>
                  <p className="text-xs text-slate-500">
                    Comfortable. Modern. Trusted.
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM IMAGES */}
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="group overflow-hidden rounded-[26px] border border-pink-100 bg-white shadow-[0_12px_30px_rgba(236,72,153,0.06)]">
                <img
                  src={picture1}
                  className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <div className="group overflow-hidden rounded-[26px] border border-pink-100 bg-white shadow-[0_12px_30px_rgba(236,72,153,0.06)]">
                <img
                  src={picture2}
                  className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              </div>

              <div className="group overflow-hidden rounded-[26px] border border-pink-100 bg-white shadow-[0_12px_30px_rgba(236,72,153,0.06)]">
                <img
                  src={picture3}
                  className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <div className="flex h-full flex-col justify-between">

            <div>
              <div className="inline-flex rounded-full border border-pink-100 bg-pink-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-pink-600">
                About Us
              </div>

              <h2 className="mt-5 text-[2.8rem] font-bold leading-[1.02] tracking-[-0.06em] text-slate-900 lg:text-[4.2rem]">
                A modern clinic experience built on comfort, care, and trust
              </h2>

              <p className="mt-6 text-[17px] leading-8 text-slate-600 max-w-[650px]">
                GC Dental Care is committed to providing quality dental services
                in a comfortable, patient-centered, and professional environment.
                Through IntelliDent, patients can enjoy a more organized and
                convenient experience for appointments, service viewing, and
                clinic interaction.
              </p>

              {/* feature cards */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] border border-pink-100 bg-pink-50/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-500">
                    Patient-Centered
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Every visit is designed to feel welcoming, comfortable, and easy.
                  </p>
                </div>

                <div className="rounded-[26px] border border-pink-100 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pink-500">
                    Digital Convenience
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    IntelliDent supports smoother appointment booking and communication.
                  </p>
                </div>
              </div>
            </div>

            {/* stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-[24px] border border-pink-100 p-5">
                <p className="text-3xl font-bold text-slate-900">15+</p>
                <p className="text-sm text-slate-500">Years Experience</p>
              </div>

              <div className="rounded-[24px] border border-pink-100 p-5">
                <p className="text-3xl font-bold text-slate-900">98%</p>
                <p className="text-sm text-slate-500">Satisfaction</p>
              </div>

              <div className="rounded-[24px] border border-pink-100 p-5">
                <p className="text-3xl font-bold text-slate-900">5000+</p>
                <p className="text-sm text-slate-500">Smiles</p>
              </div>

              <div className="rounded-[24px] border border-pink-100 p-5">
                <p className="text-3xl font-bold text-slate-900">17</p>
                <p className="text-sm text-slate-500">Experts</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}