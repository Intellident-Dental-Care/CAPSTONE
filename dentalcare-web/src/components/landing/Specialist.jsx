import SectionHeader from "./SectionHeader";

const specialists = [
  {
    name: "Dr. David Wilson",
    role: "Orthodontist",
    desc: "Focused on alignment care and treatment planning for healthier and more confident smiles.",
  },
  {
    name: "Dr. Emma Robinson",
    role: "Esthetician",
    desc: "Provides smile enhancement support through aesthetic-focused dental procedures.",
  },
  {
    name: "Dr. Sophia Turner",
    role: "Endodontist",
    desc: "Handles treatment procedures requiring accuracy, comfort, and patient-centered care.",
  },
];

export default function Specialists() {
  return (
    <section id="specialist" className="w-full px-3 sm:px-4 lg:px-6">
      <div className="w-full overflow-hidden rounded-[34px] border border-pink-200/70 bg-gradient-to-br from-white via-pink-50 to-rose-50 p-6 shadow-[0_18px_60px_rgba(236,72,153,0.10)] sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.3fr]">
          <div>
            <SectionHeader
              badge="Specialist"
              title="Meet the minds behind your smile"
              description="This section presents the owner or specialists of the clinic and highlights their professional role in delivering quality dental care."
              center={false}
            />

            <a
              href="#contact"
              className="mt-8 inline-flex rounded-full border border-pink-200 bg-white px-6 py-3 text-sm font-semibold text-pink-600 shadow-sm"
            >
              View all specialists
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {specialists.map((doctor) => (
              <div
                key={doctor.name}
                className="overflow-hidden rounded-[28px] border border-pink-100 bg-gradient-to-b from-pink-500 to-rose-400 text-white shadow-md"
              >
                <div className="flex h-64 items-center justify-center bg-white/20 text-4xl font-bold backdrop-blur-sm">
                  DR
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-100">
                    {doctor.role}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{doctor.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/90">
                    {doctor.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}