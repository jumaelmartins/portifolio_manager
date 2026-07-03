"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { CourseEntry } from "../types";
import { DeleteCourseDialog } from "./delete-course-dialog";
import { CourseMobileList } from "./course-mobile-list";
import { CourseTable } from "./course-table";

type CourseViewProps = {
  entries: CourseEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: CourseEntry) => Promise<void>;
};

const COURSE_SORTS: SortOption<CourseEntry>[] = [
  { key: "recent", label: "Newest start", compare: (a, b) => b.startDate.localeCompare(a.startDate) },
  { key: "oldest", label: "Oldest start", compare: (a, b) => a.startDate.localeCompare(b.startDate) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
];

function CourseSkeleton() {
  return (
    <div role="status" aria-label="Loading courses" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function CourseView({
  entries,
  isPending,
  error,
  onRetry,
  onDelete,
}: CourseViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<CourseEntry | null>(null);

  const controls = useListControls<CourseEntry>({
    items: entries,
    basePath: "/courses",
    searchAccessor: (entry) => `${entry.title} ${entry.institutionName}`,
    sorts: COURSE_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Course created successfully" : "Course updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/courses?${qs}` : "/courses", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <CourseSkeleton />;
  if (error) {
    return (
      <ErrorState title="Courses unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Courses
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage courses and certifications displayed in your public portfolio.
          </p>
        </div>
        <Link href="/courses/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Course
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Add your first course or certification to showcase your learning."
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          action={
            <Link href="/courses/new" className={buttonVariants({ size: "lg" })}>
              Add your first course
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search courses..."
            />
            <SortSelect
              value={controls.sortKey}
              options={COURSE_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching courses"
              description="Adjust or clear the search to see more courses."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <>
              <CourseTable entries={controls.pageItems} onDelete={setEntryToDelete} />
              <CourseMobileList entries={controls.pageItems} onDelete={setEntryToDelete} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <DeleteCourseDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
