import ownerImg from "../../assets/owner.png";

export default function Specialist() {
  return (
    <section id="specialist" className="w-full px-3 pb-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[34px] border border-pink-100/80 bg-[#fffdfd] px-6 py-8 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:px-8 lg:px-10 lg:py-10">
        {/* glow */}
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[220px] w-[220px] rounded-full bg-pink-100/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-rose-100/25 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* LEFT CONTENT */}
          <div>
            <div className="inline-flex rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-pink-600">
              Specialist
            </div>

            <h2 className="mt-5 text-[2.8rem] font-bold leading-[0.98] tracking-[-0.065em] text-slate-900 sm:text-[3.2rem] lg:text-[4.3rem]">
              Meet the expert behind every confident smile
            </h2>

            <p className="mt-6 max-w-[600px] text-[16px] leading-8 text-slate-600">
              GC Dental Care is led by a specialist committed to patient
              comfort, precision, and a more personal treatment experience.
              Every consultation and procedure is guided by care, trust, and
              attention to every smile.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-pink-100 text-sm font-semibold text-pink-600">
                  DR
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-pink-50 text-sm font-semibold text-pink-500">
                  HC
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Trusted care with a patient-first approach
              </p>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div>
            <article className="grid min-h-[560px] overflow-hidden rounded-[28px] border border-pink-100 bg-white shadow-[0_18px_40px_rgba(236,72,153,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
              {/* LEFT TEXT */}
              <div className="flex flex-col justify-between p-6 sm:p-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500">
                    Owner • Lead Dentist
                  </p>

                  <h3 className="mt-3 text-[2rem] font-bold leading-tight text-slate-900 sm:text-[2.2rem]">
                    Dr. Hannah Cervantes - Guimmayen
                  </h3>

                  <p className="mt-5 text-[15px] leading-8 text-slate-600 sm:text-[16px]">
                    Dedicated to delivering patient-focused dental care through
                    precision, comfort, and a more personal clinic experience.
                    Her approach combines clinical expertise with warmth and
                    trust, helping patients feel supported, informed, and more
                    confident throughout their smile journey.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full border border-pink-100 bg-white px-4 py-2 text-xs font-medium text-slate-600">
                    Patient-Centered
                  </span>
                  <span className="rounded-full border border-pink-100 bg-white px-4 py-2 text-xs font-medium text-slate-600">
                    Comfort-First
                  </span>
                  <span className="rounded-full border border-pink-100 bg-white px-4 py-2 text-xs font-medium text-slate-600">
                    Modern Care
                  </span>
                </div>
              </div>

              {/* RIGHT IMAGE */}
              <div className="relative min-h-[320px] lg:min-h-full">
                <img
                  src={ownerImg}
                  alt="Dr. Hannah Cervantes - Guimmayen"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}