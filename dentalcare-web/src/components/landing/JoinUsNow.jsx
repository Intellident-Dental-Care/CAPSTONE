export default function JoinUsNow() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] bg-gradient-to-r from-pink-500 to-rose-400 p-6 shadow-[0_18px_60px_rgba(236,72,153,0.20)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-100 sm:text-sm">
              Join Us Now
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Download the IntelliDent mobile application
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-pink-50 sm:text-base">
              Patients can enjoy a more convenient booking experience by
              downloading the IntelliDent APK and accessing the mobile app.
            </p>

            <div className="mt-8">
              <a
                href="/downloads/intellident.apk"
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-md"
              >
                Download APK
              </a>
            </div>
          </div>

          <div className="rounded-[30px] bg-white/15 p-6 backdrop-blur-sm">
            <div className="rounded-[26px] bg-white/15 p-6 text-white">
              <p className="text-sm font-semibold">Mobile Access</p>
              <h3 className="mt-3 text-2xl font-bold">Book anytime, anywhere</h3>
              <p className="mt-3 text-sm leading-7 text-pink-50">
                The mobile application allows patients to view services, choose
                schedules, and manage appointments more conveniently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}