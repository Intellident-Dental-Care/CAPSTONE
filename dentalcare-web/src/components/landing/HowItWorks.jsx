import SectionHeader from "./SectionHeader";

const steps = [
  {
    step: "01",
    title: "Start with Pre-Assessment",
    desc: "Patients answer guided questions, describe symptoms, and optionally upload photos to receive an initial AI-based dental assessment.",
  },
  {
    step: "02",
    title: "Book an appointment",
    desc: "Based on the assessment, patients can easily select a service, choose a branch and dentist, and schedule their preferred time.",
  },
  {
    step: "03",
    title: "Clinic manages your visit",
    desc: "Dentists and admins confirm appointments, organize schedules, and prepare for the patient’s visit through the dashboard.",
  },
  {
    step: "04",
    title: "Treatment & follow-up",
    desc: "After the visit, treatment plans, procedures, and patient history are recorded to ensure continuous and personalized care.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full px-3 pb-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[34px] border border-pink-100/80 bg-[#fffdfd] px-6 py-8 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:px-8 lg:px-10 lg:py-10">

        {/* glow */}
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[220px] w-[220px] rounded-full bg-pink-100/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-rose-100/25 blur-3xl" />

        <div className="relative z-10">

          <SectionHeader
            badge="How It Works"
            title="A smarter and more guided dental journey"
            description="From pre-assessment to treatment, IntelliDent simplifies every step for both patients and clinics."
          />

          {/* STEPS */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="group relative overflow-hidden rounded-[26px] border border-pink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(236,72,153,0.12)]"
              >
                {/* number */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 text-sm font-bold text-white shadow-sm">
                  {item.step}
                </div>

                {/* title */}
                <h3 className="mt-5 text-[1.15rem] font-semibold text-slate-900">
                  {item.title}
                </h3>

                {/* desc */}
                <p className="mt-3 text-[0.95rem] leading-7 text-slate-600">
                  {item.desc}
                </p>

                {/* subtle hover line */}
                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}