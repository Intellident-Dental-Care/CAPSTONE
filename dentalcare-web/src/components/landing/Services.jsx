import aestheticImg from "../../assets/service1.jpg";
import orthoImg from "../../assets/service2.jpg";
import implantImg from "../../assets/service3.jpg";
import whiteningImg from "../../assets/service4.jpg";
import surgicalImg from "../../assets/service5.jpg";

export default function Services() {
  const services = [
    {
      title: "Aesthetic dentistry",
      image: aestheticImg,
      eyebrow: "Refined smile design for natural beauty",
      description:
        "Enhance the overall appearance of your smile with treatments designed to improve symmetry, brightness, and harmony—creating results that feel both confident and natural.",
    },
    {
      title: "Orthodontics",
      image: orthoImg,
      eyebrow: "Straighter smiles with modern solutions",
      description:
        "Achieve better alignment and bite balance through guided orthodontic care that improves both comfort and long-term dental health.",
    },
    {
      title: "Implantology",
      image: implantImg,
      eyebrow: "Smile restoration built to last",
      description:
        "Restore missing teeth with strong, natural-looking implants that integrate seamlessly for durability, stability, and long-term confidence.",
    },
    {
      title: "Whitening",
      image: whiteningImg,
      eyebrow: "Brighter, cleaner confidence",
      description:
        "Lift stains and discoloration with safe, effective whitening treatments designed to reveal a noticeably fresher and more vibrant smile.",
    },
    {
      title: "Surgical dentistry",
      image: surgicalImg,
      eyebrow: "Advanced care with precision",
      description:
        "Receive carefully planned surgical procedures handled with precision, comfort, and recovery in mind for the best possible outcomes.",
    },
  ];

  return (
    <section id="services" className="w-full px-3 pb-3 sm:px-4 lg:px-5">
      <div className="relative overflow-hidden rounded-[34px] border border-pink-100/80 bg-[#fffdfd] px-6 py-8 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[220px] w-[220px] rounded-full bg-pink-100/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-rose-100/25 blur-3xl" />

        <div className="relative z-10">
          <div className="mx-auto max-w-[760px] text-center">
            <div className="inline-flex rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-pink-600">
              Services
            </div>

            <h2 className="mt-5 text-[2.7rem] font-bold tracking-[-0.06em] text-slate-900 lg:text-[4rem]">
              Expert care for every smile
            </h2>

            <p className="mx-auto mt-5 max-w-[600px] text-slate-600">
              We offer a full spectrum of treatments tailored for comfort,
              confidence, and long-term care.
            </p>
          </div>

          <div className="mt-10 flex gap-5 overflow-hidden">
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative flex-1 transition-all duration-500 ease-out hover:flex-[1.4]"
              >
                <article
                  className="relative h-[360px] overflow-hidden rounded-[24px] border border-pink-100 bg-white transition-all duration-500 ease-out
                  shadow-[0_10px_25px_rgba(0,0,0,0.06)]
                  hover:shadow-[0_30px_60px_rgba(236,72,153,0.18),0_0_60px_rgba(255,182,193,0.35)]"
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.08]"
                  />

                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] transition duration-500 group-hover:bg-white/20" />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5 z-10 transition duration-300 group-hover:opacity-0">
                    <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow">
                      {service.title}
                    </h3>
                  </div>

                  <div
                    className="invisible absolute inset-y-4 right-4 z-20 w-[60%] translate-x-[120%] overflow-hidden rounded-[22px] border border-white/40 bg-white/82 p-5 opacity-0 backdrop-blur-md transition-all duration-500 ease-out
                    group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-100"
                  >
                    <p className="text-[1rem] font-semibold leading-6 tracking-[-0.02em] text-slate-900">
                      {service.eyebrow}
                    </p>

                    <div className="mt-3 h-[2px] w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-400" />

                    <p className="mt-4 text-[0.95rem] leading-7 text-slate-600">
                      {service.description}
                    </p>

                    <div className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-sm text-white shadow-md">
                      ↗
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}