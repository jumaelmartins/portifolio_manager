"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteTechnology,
  useTechnologies,
} from "../api/technology-queries";
import { TechnologyView } from "./technology-view";

type TechnologiesManagerProps = {
  canDelete: boolean;
};

export function TechnologiesManager({ canDelete }: TechnologiesManagerProps) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading technologies" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      }
    >
      <TechnologiesManagerContent canDelete={canDelete} />
    </Suspense>
  );
}

function TechnologiesManagerContent({ canDelete }: TechnologiesManagerProps) {
  const technologies = useTechnologies();
  const deleteTechnology = useDeleteTechnology();

  return (
    <TechnologyView
      entries={technologies.data ?? []}
      isPending={technologies.isPending}
      error={technologies.error}
      canDelete={canDelete}
      onRetry={() => void technologies.refetch()}
      onDelete={async (entry) => {
        await deleteTechnology.mutateAsync(entry.id);
      }}
    />
  );
}
