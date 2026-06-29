"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteCourse,
  useCourses,
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
  const courses = useCourses();
  const deleteCourse = useDeleteCourse();

  return (
    <CourseView
      entries={courses.data ?? []}
      isPending={courses.isPending}
      error={courses.error}
      onRetry={() => void courses.refetch()}
      onDelete={async (entry) => {
        await deleteCourse.mutateAsync(entry.id);
      }}
    />
  );
}
