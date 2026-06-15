import { FolderKanban, ImageIcon, ImageOff, Tags } from "lucide-react";

import { MetricCard } from "@/features/dashboard/components/metric-card";
import type { Project } from "../types";

export function ProjectSummary({ projects }: { projects: Project[] }) {
  const withCover = projects.filter((project) => project.coverImage).length;
  const categories = new Set(
    projects.map((project) => project.category.id),
  ).size;

  return (
    <section
      aria-label="Project summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        label="Total projects"
        value={projects.length}
        description="All portfolio entries"
        icon={FolderKanban}
      />
      <MetricCard
        label="With cover"
        value={withCover}
        description="Ready to present"
        icon={ImageIcon}
        tone="blue"
      />
      <MetricCard
        label="Without cover"
        value={projects.length - withCover}
        description="Needs attention"
        icon={ImageOff}
        tone="amber"
      />
      <MetricCard
        label="Categories"
        value={categories}
        description="Represented in projects"
        icon={Tags}
        tone="violet"
      />
    </section>
  );
}
