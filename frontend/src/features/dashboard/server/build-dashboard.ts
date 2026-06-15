import type { DashboardData, DashboardSource } from "../types";

export function buildDashboard(source: DashboardSource): DashboardData {
  const withCover = source.projects.filter(
    (project) => project.coverImage !== null,
  ).length;

  return {
    metrics: {
      projects: source.projects.length,
      categories: source.categories.length,
      technologies: source.technologies.length,
      withCover,
      withoutCover: source.projects.length - withCover,
    },
    recentProjects: [...source.projects]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .slice(0, 5),
  };
}
