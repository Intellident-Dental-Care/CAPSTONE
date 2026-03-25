import SectionHeader from "./SectionHeader";

export default function AboutUs() {
  return (
    <section id="about" className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-gradient-to-br from-pink-100 via-rose-50 to-white p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div className="rounded-[28px] bg-white/70 p-6 backdrop-blur-sm sm:p-8">
            <p className="text-sm leading-8 text-slate-700 sm:text-base">
              GC Dental Care is dedicated to providing quality dental services in
              a comfortable, patient-centered, and professional environment. The
              clinic focuses on promoting oral health through reliable treatment,
              proper consultation, and continuous care.
            </p>

            <p className="mt-5 text-sm leading-8 text-slate-700 sm:text-base">
              Through IntelliDent, GC Dental Care improves the overall patient
              experience by making appointment scheduling, service viewing,
              patient record handling, and clinic workflow more organized and
              efficient.
            </p>
          </div>

          <div>
            <SectionHeader
              badge="About Us"
              title="A modern clinic experience with comfort, care, and technology"
              description="This section introduces GC Dental Care and highlights the clinic’s mission, environment, and commitment to quality service."
              center={false}
            />

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">15+</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Years Experience</p>
              </div>

              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">98%</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Patient Satisfaction</p>
              </div>

              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">5000+</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Smiles Assisted</p>
              </div>

              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-bold text-slate-900">17</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Clinic Experts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}