"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { parseContentState } from "@/lib/content-state";
import {
  useArchiveCourse,
  useCourses,
  useDeleteCourse,
  usePurgeCourse,
  useRestoreCourse,
  useUnarchiveCourse,
} from "@/features/courses/api/course-queries";
import { CourseView } from "@/features/courses/components/course-view";

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading courses" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      }
    >
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const state = parseContentState(searchParams.get("state"));

  const courses = useCourses(state);
  const softDelete = useDeleteCourse();
  const archive = useArchiveCourse();
  const unarchive = useUnarchiveCourse();
  const restore = useRestoreCourse();
  const purge = usePurgeCourse();

  return (
    <CourseView
      entries={courses.data ?? []}
      state={state}
      isPending={courses.isPending}
      error={courses.error}
      onRetry={() => void courses.refetch()}
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
