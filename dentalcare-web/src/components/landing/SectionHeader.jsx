export default function SectionHeader({
  badge,
  title,
  description,
  center = true,
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pink-500 sm:text-sm">
        {badge}
      </p>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}