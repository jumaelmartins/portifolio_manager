"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { parseContentState } from "@/lib/content-state";
import {
  useArchiveExperience,
  useDeleteExperience,
  useExperiences,
  usePurgeExperience,
  useRestoreExperience,
  useUnarchiveExperience,
} from "@/features/experience/api/experience-queries";
import { ExperienceView } from "@/features/experience/components/experience-view";

export default function ExperiencePage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading experience" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      }
    >
      <ExperiencePageContent />
    </Suspense>
  );
}

function ExperiencePageContent() {
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const experiences = useExperiences(state);
  const softDelete = useDeleteExperience();
  const archive = useArchiveExperience();
  const unarchive = useUnarchiveExperience();
  const restore = useRestoreExperience();
  const purge = usePurgeExperience();

  return (
    <ExperienceView
      entries={experiences.data ?? []}
      state={state}
      isPending={experiences.isPending}
      error={experiences.error}
      onRetry={() => void experiences.refetch()}
      onArchive={(entry) => archive.mutate(entry.id)}
      onUnarchive={(entry) => unarchive.mutate(entry.id)}
      onRestore={(entry) => restore.mutate(entry.id)}
      onSoftDelete={(entry) => softDelete.mutate(entry.id)}
      onPurge={async (entry) => {
        await purge.mutateAsync(entry.id);
      }}
    />
  );
}
