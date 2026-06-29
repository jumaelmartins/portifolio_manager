"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateEducation,
  useEducation,
  useUpdateEducation,
} from "../api/education-queries";
import type { EducationInput } from "../types";
import { EducationForm } from "./education-form";

type EducationEditorProps = {
  mode: "create" | "edit";
  entryId?: number;
};

export function EducationEditor({ mode, entryId = 0 }: EducationEditorProps) {
  const router = useRouter();
  const entry = useEducation(entryId);
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(entryId) || entryId <= 0)) {
    return (
      <ErrorState
        title="Invalid entry"
        description="The requested education ID is not valid."
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
        title="Education unavailable"
        description={entry.error?.message ?? "The entry could not be loaded."}
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const defaultValues: EducationInput | undefined = entry.data
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
          href="/education"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to education
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit education" : "Add education"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this education entry."
            : "Add an education entry to your portfolio."}
        </p>
      </header>

      <EducationForm
        key={editing ? entryId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateEducation.mutateAsync({ id: entryId, input });
            router.push("/education?updated=1");
            return;
          }
          await createEducation.mutateAsync(input);
          router.push("/education?created=1");
        }}
      />
    </div>
  );
}
