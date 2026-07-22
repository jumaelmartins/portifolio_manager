"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { parseContentState } from "@/lib/content-state";
import {
  useArchiveEducation,
  useDeleteEducation,
  useEducations,
  usePurgeEducation,
  useRestoreEducation,
  useUnarchiveEducation,
} from "@/features/education/api/education-queries";
import { EducationView } from "@/features/education/components/education-view";

export default function EducationPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading education" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      }
    >
      <EducationPageContent />
    </Suspense>
  );
}

function EducationPageContent() {
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const educations = useEducations(state);
  const softDelete = useDeleteEducation();
  const archive = useArchiveEducation();
  const unarchive = useUnarchiveEducation();
  const restore = useRestoreEducation();
  const purge = usePurgeEducation();

  return (
    <EducationView
      entries={educations.data ?? []}
      state={state}
      isPending={educations.isPending}
      error={educations.error}
      onRetry={() => void educations.refetch()}
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
