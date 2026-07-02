"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateTechnology,
  useTechnology,
  useUpdateTechnology,
} from "../api/technology-queries";
import type { TechnologyInput } from "../types";
import { TechnologyForm } from "./technology-form";

type TechnologyEditorProps = {
  mode: "create" | "edit";
  entryId?: number;
};

export function TechnologyEditor({ mode, entryId = 0 }: TechnologyEditorProps) {
  const router = useRouter();
  const entry = useTechnology(entryId);
  const createTechnology = useCreateTechnology();
  const updateTechnology = useUpdateTechnology();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(entryId) || entryId <= 0)) {
    return (
      <ErrorState
        title="Invalid technology"
        description="The requested technology ID is not valid."
      />
    );
  }

  if (editing && entry.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[280px] max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (editing && (entry.error || !entry.data)) {
    return (
      <ErrorState
        title="Technology unavailable"
        description={entry.error?.message ?? "The technology could not be loaded."}
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const defaultValues: TechnologyInput | undefined = entry.data
    ? { name: entry.data.name }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/technologies"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to technologies
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit technology" : "Add technology"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this technology tag."
            : "Add a technology tag for your projects."}
        </p>
      </header>

      <TechnologyForm
        key={editing ? entryId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateTechnology.mutateAsync({ id: entryId, input });
            router.push("/technologies?updated=1");
            return;
          }
          await createTechnology.mutateAsync(input);
          router.push("/technologies?created=1");
        }}
      />
    </div>
  );
}
