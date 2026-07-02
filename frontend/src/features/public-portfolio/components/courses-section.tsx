import { formatDateRange } from "../server/normalize-portfolio";
import type { PublicCourse } from "../types";
import { SectionShell } from "./section-shell";
import { TimelineEntry } from "./timeline-entry";

export function CoursesSection({ courses }: { courses: PublicCourse[] }) {
  if (courses.length === 0) return null;
  return (
    <SectionShell id="courses" title="Courses">
      <div className="space-y-6">
        {courses.map((item) => (
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
