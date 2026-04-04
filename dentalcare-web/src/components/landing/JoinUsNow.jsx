export default function JoinUsNow() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full rounded-[32px] border border-pink-100 bg-gradient-to-br from-pink-500 to-rose-400 p-6 shadow-[0_16px_45px_rgba(236,72,153,0.16)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="text-white">
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-50 sm:text-xs">
              Join Us Now
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Download the IntelliDent mobile application
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-pink-50 sm:text-base">
              Patients can enjoy a more convenient and organized booking
              experience through the IntelliDent mobile app.
            </p>

            <div className="mt-8">
              <a
                href="#"
                download
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-sm transition hover:scale-[1.02]"
              >
                Download Now
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <div className="rounded-[24px] bg-white/10 p-6 text-white">
              <p className="text-sm font-semibold text-pink-50">
                Mobile Access
              </p>
              <h3 className="mt-3 text-2xl font-bold">
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