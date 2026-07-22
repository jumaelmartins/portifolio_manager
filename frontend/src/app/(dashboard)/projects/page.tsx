"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { parseContentState } from "@/lib/content-state";
import {
  useArchiveProject,
  useCategories,
  useDeleteProject,
  useProjects,
  usePurgeProject,
  useRestoreProject,
  useTechnologies,
  useUnarchiveProject,
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
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const projects = useProjects(state);
  const categories = useCategories();
  const technologies = useTechnologies();
  const softDelete = useDeleteProject();
  const archive = useArchiveProject();
  const unarchive = useUnarchiveProject();
  const restore = useRestoreProject();
  const purge = usePurgeProject();
  const error = projects.error || categories.error || technologies.error;

  return (
    <ProjectsView
      projects={projects.data ?? []}
      categories={categories.data ?? []}
      technologies={technologies.data ?? []}
      state={state}
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
      onArchive={(project) => archive.mutate(project.id)}
      onUnarchive={(project) => unarchive.mutate(project.id)}
      onRestore={(project) => restore.mutate(project.id)}
      onSoftDelete={(project) => softDelete.mutate(project.id)}
      onPurge={async (project) => {
        await purge.mutateAsync(project.id);
      }}
    />
  );
}
