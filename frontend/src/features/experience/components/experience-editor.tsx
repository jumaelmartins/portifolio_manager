"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateExperience,
  useExperience,
  useUpdateExperience,
} from "../api/experience-queries";
import type { ExperienceInput } from "../types";
import { ExperienceForm } from "./experience-form";

type ExperienceEditorProps = {
  mode: "create" | "edit";
  entryId?: number;
};

export function ExperienceEditor({ mode, entryId = 0 }: ExperienceEditorProps) {
  const router = useRouter();
  const entry = useExperience(entryId);
  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(entryId) || entryId <= 0)) {
    return (
      <ErrorState
        title="Invalid entry"
        description="The requested experience ID is not valid."
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
        title="Experience unavailable"
        description={entry.error?.message ?? "The entry could not be loaded."}
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const defaultValues: ExperienceInput | undefined = entry.data
    ? {
        title: entry.data.title,
        companyName: entry.data.companyName,
        description: entry.data.description,
        startDate: entry.data.startDate,
        endDate: entry.data.endDate ?? "",
        current: entry.data.current,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/experience"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to experience
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit experience" : "Add experience"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this work experience entry."
            : "Add a work experience entry to your portfolio."}
        </p>
      </header>

      <ExperienceForm
        key={editing ? entryId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateExperience.mutateAsync({ id: entryId, input });
            router.push("/experience?updated=1");
            return;
          }
          await createExperience.mutateAsync(input);
          router.push("/experience?created=1");
        }}
      />
    </div>
  );
}
