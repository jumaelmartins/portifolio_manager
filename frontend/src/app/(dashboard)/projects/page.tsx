"use client";

import { Suspense } from "react";

import {
  useCategories,
  useDeleteProject,
  useProjects,
  useTechnologies,
} from "@/features/projects/api/project-queries";
import { ProjectsView } from "@/features/projects/components/projects-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading projects" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
        </div>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  );
}

function ProjectsPageContent() {
  const projects = useProjects();
  const categories = useCategories();
  const technologies = useTechnologies();
  const deleteProject = useDeleteProject();
  const error = projects.error || categories.error || technologies.error;

  return (
    <ProjectsView
      projects={projects.data ?? []}
      categories={categories.data ?? []}
      technologies={technologies.data ?? []}
      isPending={
        projects.isPending || categories.isPending || technologies.isPending
      }
      error={error}
      onRetry={() => {
        void Promise.all([
          projects.refetch(),
          categories.refetch(),
          technologies.refetch(),
        ]);
      }}
      onDelete={async (project) => {
        await deleteProject.mutateAsync(project.id);
      }}
    />
  );
}
