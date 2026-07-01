// frontend/src/app/(dashboard)/custom-sections/page.tsx
"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
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
      <SectionsView />
    </Suspense>
  );
}
