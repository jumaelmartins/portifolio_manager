"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateCourse,
  useCourse,
  useUpdateCourse,
} from "../api/course-queries";
import type { CourseInput } from "../types";
import { CourseForm } from "./course-form";

type CourseEditorProps = {
  mode: "create" | "edit";
  entryId?: number;
};

export function CourseEditor({ mode, entryId = 0 }: CourseEditorProps) {
  const router = useRouter();
  const entry = useCourse(entryId);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(entryId) || entryId <= 0)) {
    return (
      <ErrorState
        title="Invalid entry"
        description="The requested course ID is not valid."
      />
    );
  }

  if (editing && entry.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[480px] max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (editing && (entry.error || !entry.data)) {
    return (
      <ErrorState
        title="Course unavailable"
        description={entry.error?.message ?? "The entry could not be loaded."}
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const defaultValues: CourseInput | undefined = entry.data
    ? {
        title: entry.data.title,
        institutionName: entry.data.institutionName,
        description: entry.data.description ?? "",
        startDate: entry.data.startDate,
        endDate: entry.data.endDate ?? "",
        current: entry.data.current,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/courses"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to courses
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit course" : "Add course"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this course entry."
            : "Add a course entry to your portfolio."}
        </p>
      </header>

      <CourseForm
        key={editing ? entryId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateCourse.mutateAsync({ id: entryId, input });
            router.push("/courses?updated=1");
            return;
          }
          await createCourse.mutateAsync(input);
          router.push("/courses?created=1");
        }}
      />
    </div>
  );
}
