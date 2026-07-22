// frontend/src/app/(dashboard)/custom-sections/page.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { parseContentState } from "@/lib/content-state";
import {
  useArchiveSection,
  useDeleteSection,
  usePurgeSection,
  useRestoreSection,
  useSections,
  useUnarchiveSection,
} from "@/features/custom-sections/api/custom-sections-queries";
import { SectionsView } from "@/features/custom-sections/components/sections-view";

export default function CustomSectionsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading custom sections" className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <CustomSectionsPageContent />
    </Suspense>
  );
}

function CustomSectionsPageContent() {
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const sections = useSections(state);
  const softDelete = useDeleteSection();
  const archive = useArchiveSection();
  const unarchive = useUnarchiveSection();
  const restore = useRestoreSection();
  const purge = usePurgeSection();

  return (
    <SectionsView
      sections={sections.data ?? []}
      state={state}
      isPending={sections.isPending}
      error={sections.error}
      onRetry={() => void sections.refetch()}
      onArchive={(section) => archive.mutate(section.id)}
      onUnarchive={(section) => unarchive.mutate(section.id)}
      onRestore={(section) => restore.mutate(section.id)}
      onSoftDelete={(section) => softDelete.mutate(section.id)}
      onPurge={async (section) => {
        await purge.mutateAsync(section.id);
      }}
    />
  );
}
