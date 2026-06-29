"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteEducation,
  useEducations,
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
  const educations = useEducations();
  const deleteEducation = useDeleteEducation();

  return (
    <EducationView
      entries={educations.data ?? []}
      isPending={educations.isPending}
      error={educations.error}
      onRetry={() => void educations.refetch()}
      onDelete={async (entry) => {
        await deleteEducation.mutateAsync(entry.id);
      }}
    />
  );
}
