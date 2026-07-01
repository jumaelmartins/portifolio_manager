import { formatDateRange } from "../server/normalize-portfolio";
import type { PublicEducation } from "../types";
import { SectionShell } from "./section-shell";
import { TimelineEntry } from "./timeline-entry";

export function EducationSection({ education }: { education: PublicEducation[] }) {
  if (education.length === 0) return null;
  return (
    <SectionShell id="education" title="Education">
      <div className="space-y-6">
        {education.map((item) => (
          <TimelineEntry
            key={item.id}
            title={item.title}
            subtitle={item.institution}
            dateRange={formatDateRange(item.startDate, item.endDate)}
            description={item.description}
          />
        ))}
      </div>
    </SectionShell>
  );
}
