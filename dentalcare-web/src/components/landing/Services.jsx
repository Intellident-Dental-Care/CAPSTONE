import SectionHeader from "./SectionHeader";

const services = [
  {
    title: "Aesthetic Dentistry",
    desc: "Improves smile appearance through treatments focused on confidence and overall aesthetics.",
  },
  {
    title: "Orthodontics",
    desc: "Supports teeth alignment and bite correction with professional orthodontic care.",
  },
  {
    title: "Implantology",
    desc: "Provides replacement solutions for missing teeth with a long-term functional result.",
  },
  {
    title: "Whitening",
    desc: "Enhances tooth brightness for a cleaner and fresher smile appearance.",
  },
  {
    title: "Surgical Dentistry",
    desc: "Handles more advanced dental procedures with proper care and clinical precision.",
  },
];

export default function Services() {
  return (
    <section id="services" className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-white p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <SectionHeader
          badge="Services"
          title="Expert care for every smile"
          description="Hover each service card to view a short description of the service offered by GC Dental Care."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative min-h-[260px] overflow-hidden rounded-[28px] bg-gradient-to-b from-pink-400 via-pink-300 to-rose-200 p-5 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_45%)]" />

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-sm">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm text-white/80">Hover to view details</p>

                  <div className="mt-4 max-h-0 overflow-hidden text-sm leading-7 text-white/95 transition-all duration-300 group-hover:max-h-40">
                    {service.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}