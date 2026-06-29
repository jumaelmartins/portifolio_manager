"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteExperience,
  useExperiences,
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
  const experiences = useExperiences();
  const deleteExperience = useDeleteExperience();

  return (
    <ExperienceView
      entries={experiences.data ?? []}
      isPending={experiences.isPending}
      error={experiences.error}
      onRetry={() => void experiences.refetch()}
      onDelete={async (entry) => {
        await deleteExperience.mutateAsync(entry.id);
      }}
    />
  );
}
