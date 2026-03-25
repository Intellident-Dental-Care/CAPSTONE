import SectionHeader from "./SectionHeader";

const items = [
  {
    title: "Online Appointment Booking",
    desc: "Patients can schedule appointments more conveniently through the mobile application.",
  },
  {
    title: "Patient Record Management",
    desc: "Clinic staff can organize and monitor patient information more efficiently.",
  },
  {
    title: "Appointment Monitoring",
    desc: "Dentists and admins can view and manage appointments through the dashboard.",
  },
  {
    title: "Role-Based Access",
    desc: "Separate access for dentist and admin users supports better workflow and control.",
  },
];

export default function ApplicationOverview() {
  return (
    <section id="overview" className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <SectionHeader
          badge="Application Overview"
          title="Core functionalities of the IntelliDent application"
          description="Hover each functionality card to read its explanation and understand how the system supports patients, dentists, and administrators."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="group rounded-[28px] border border-pink-100 bg-pink-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 text-lg font-bold text-white shadow-sm">
                {index + 1}
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 text-sm text-slate-500">Hover to view explanation</p>

              <div className="mt-4 max-h-0 overflow-hidden text-sm leading-7 text-slate-600 transition-all duration-300 group-hover:max-h-40">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}