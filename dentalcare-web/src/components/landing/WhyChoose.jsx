import SectionHeader from "./SectionHeader";

const features = [
  {
    title: "Mobile + Web Integration",
    desc: "Patients use the mobile app while clinic staff manage appointments through the web dashboard.",
  },
  {
    title: "More Organized Workflow",
    desc: "Schedules, patient data, and appointment monitoring become easier to handle.",
  },
  {
    title: "Better Patient Convenience",
    desc: "Patients can view services and book more easily without relying only on manual clinic processes.",
  },
  {
    title: "Professional Digital Experience",
    desc: "The system supports a cleaner and more modern dental management process.",
  },
];

export default function WhyChoose() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.15fr]">
          <div>
            <SectionHeader
              badge="Why IntelliDent"
              title="Why IntelliDent makes clinic management easier"
              description="The system supports both patient convenience and clinic efficiency through a connected digital workflow."
              center={false}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}