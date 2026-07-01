import { formatDateRange } from "../server/normalize-portfolio";
import type { PublicExperience } from "../types";
import { SectionShell } from "./section-shell";
import { TimelineEntry } from "./timeline-entry";

export function ExperienceSection({ experience }: { experience: PublicExperience[] }) {
  if (experience.length === 0) return null;
  return (
    <SectionShell id="experience" title="Experience">
      <div className="space-y-6">
        {experience.map((item) => (
          <TimelineEntry
            key={item.id}
            title={item.title}
            subtitle={item.company}
            dateRange={formatDateRange(item.startDate, item.endDate)}
            description={item.description}
          />
        ))}
      </div>
    </SectionShell>
  );
}
