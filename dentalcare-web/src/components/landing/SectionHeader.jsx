export default function SectionHeader({
  badge,
  title,
  description,
  center = true,
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="inline-flex rounded-full bg-pink-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-pink-600 sm:text-xs">
        {badge}
      </p>

      <h2 className="mt-4 text-[2rem] font-bold leading-tight text-slate-900 sm:text-[2.8rem] lg:text-5xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}