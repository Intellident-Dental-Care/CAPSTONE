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
      <div className="relative overflow-hidden rounded-[26px] border border-pink-100/80 bg-[#fffdfd] px-4 py-5 shadow-[0_18px_60px_rgba(236,72,153,0.08)] sm:rounded-[30px] sm:px-6 sm:py-7 lg:rounded-[34px] lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute left-[-100px] top-[-80px] h-[220px] w-[220px] rounded-full bg-pink-100/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-120px] top-[120px] h-[260px] w-[260px] rounded-full bg-rose-100/25 blur-3xl" />

        <div className="relative z-10">
          <div className="mx-auto max-w-[760px] text-center">
            <div className="inline-flex rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-pink-600 sm:text-xs sm:tracking-[0.28em]">
              Services
            </div>

            <h2 className="mt-4 text-[2rem] font-bold tracking-[-0.06em] text-slate-900 sm:mt-5 sm:text-[2.8rem] lg:text-[4rem]">
              Expert care for every smile
            </h2>

            <p className="mx-auto mt-4 max-w-[600px] text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base">
              We offer a full spectrum of treatments tailored for comfort,
              confidence, and long-term care.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 xl:flex xl:gap-5 xl:overflow-hidden">
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative xl:flex-1 xl:transition-all xl:duration-500 xl:ease-out xl:hover:flex-[1.4]"
              >
                <article
                  className="relative h-[320px] overflow-hidden rounded-[22px] border border-pink-100 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:shadow-[0_30px_60px_rgba(236,72,153,0.18),0_0_60px_rgba(255,182,193,0.35)] sm:h-[360px] sm:rounded-[24px]"
                >
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.08]"
                  />

                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] transition duration-500 group-hover:bg-white/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5 z-10 transition duration-300 xl:group-hover:opacity-0">
                    <h3 className="text-lg font-semibold tracking-tight text-white drop-shadow sm:text-xl">
                      {service.title}
                    </h3>
                  </div>

                  <div className="absolute inset-x-4 bottom-4 z-20 rounded-[20px] border border-white/40 bg-white/82 p-4 opacity-100 backdrop-blur-md transition-all duration-500 ease-out sm:p-5 xl:inset-y-4 xl:right-4 xl:left-auto xl:w-[60%] xl:translate-x-[120%] xl:opacity-0 xl:group-hover:translate-x-0 xl:group-hover:opacity-100 xl:group-hover:delay-100">
                    <p className="pr-8 text-[0.95rem] font-semibold leading-6 tracking-[-0.02em] text-slate-900 sm:text-[1rem]">
                      {service.eyebrow}
                    </p>

                    <div className="mt-3 h-[2px] w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-400" />

                    <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">
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