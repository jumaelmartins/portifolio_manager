export function TimelineEntry({
  title,
  subtitle,
  dateRange,
  description,
}: {
  title: string;
  subtitle: string;
  dateRange: string;
  description: string;
}) {
  return (
    <article className="border-l-2 border-border pl-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {dateRange ? <span className="text-sm text-muted-foreground">{dateRange}</span> : null}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </article>
  );
}
