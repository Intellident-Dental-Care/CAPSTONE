import SectionHeader from "./SectionHeader";

const steps = [
  {
    step: "01",
    title: "Patient explores services",
    desc: "The patient views available dental services and clinic information from the landing page or mobile app.",
  },
  {
    step: "02",
    title: "Appointment gets booked",
    desc: "The patient chooses the needed schedule and submits an appointment through IntelliDent.",
  },
  {
    step: "03",
    title: "Clinic manages the visit",
    desc: "Dentists and admins monitor, confirm, and organize the appointment using the dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <SectionHeader
          badge="How It Works"
          title="A simple digital journey for patients and clinics"
          description="IntelliDent helps make booking, monitoring, and clinic-side appointment handling more organized."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-[28px] bg-pink-50 p-6 shadow-sm"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 text-sm font-bold text-white">
                {item.step}
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}