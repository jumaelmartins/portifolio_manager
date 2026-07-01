"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ProfileView } from "@/features/profile/components/profile-view";

export default function AccountSettingsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading profile" className="max-w-2xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <ProfileView />
    </Suspense>
  );
}
