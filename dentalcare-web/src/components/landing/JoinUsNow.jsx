export default function JoinUsNow() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full rounded-[26px] border border-pink-100 bg-gradient-to-br from-pink-500 to-rose-400 p-5 shadow-[0_16px_45px_rgba(236,72,153,0.16)] sm:rounded-[30px] sm:p-7 lg:rounded-[32px] lg:p-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-8">
          <div className="text-white">
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-50 sm:text-xs">
              Join Us Now
            </p>

            <h2 className="mt-4 text-[2rem] font-bold leading-tight sm:text-[2.8rem] lg:text-5xl">
              Download the IntelliDent mobile application
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-pink-50 sm:text-base">
              Patients can enjoy a more convenient and organized booking
              experience through the IntelliDent mobile app.
            </p>

            <div className="mt-7 sm:mt-8">
              <a
                href="https://github.com/Intellident-Dental-Care/CAPSTONE/releases/download/v1.0.0/application-b3f5f383-b8f3-4c36-9261-77653952f297.apk"
                download="IntelliDent.apk"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-sm transition hover:scale-[1.02]"
              >
                Download Now
              </a>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:rounded-[26px] sm:p-5 lg:rounded-[28px]">
            <div className="rounded-[20px] bg-white/10 p-5 text-white sm:rounded-[22px] sm:p-6 lg:rounded-[24px]">
              <p className="text-sm font-semibold text-pink-50">
                Mobile Access
              </p>
              <h3 className="mt-3 text-[1.5rem] font-bold sm:text-2xl">
                Book anytime, anywhere
              </h3>
              <p className="mt-3 text-sm leading-7 text-pink-50">
                Patients can view services, manage appointments, and experience
                a more accessible way of connecting with GC Dental Care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}