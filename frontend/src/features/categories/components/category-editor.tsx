"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategory,
  useCreateCategory,
  useUpdateCategory,
} from "../api/category-queries";
import type { CategoryInput } from "../types";
import { CategoryForm } from "./category-form";

type CategoryEditorProps = {
  mode: "create" | "edit";
  entryId?: number;
};

export function CategoryEditor({ mode, entryId = 0 }: CategoryEditorProps) {
  const router = useRouter();
  const entry = useCategory(entryId);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const editing = mode === "edit";

  if (editing && (!Number.isInteger(entryId) || entryId <= 0)) {
    return (
      <ErrorState
        title="Invalid category"
        description="The requested category ID is not valid."
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
        title="Category unavailable"
        description={entry.error?.message ?? "The category could not be loaded."}
        onRetry={() => void entry.refetch()}
      />
    );
  }

  const defaultValues: CategoryInput | undefined = entry.data
    ? { name: entry.data.name }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/categories"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to categories
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit category" : "Add category"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update this project category."
            : "Add a category to group your projects."}
        </p>
      </header>

      <CategoryForm
        key={editing ? entryId : "new"}
        mode={mode}
        defaultValues={defaultValues}
        onSubmit={async (input) => {
          if (editing) {
            await updateCategory.mutateAsync({ id: entryId, input });
            router.push("/categories?updated=1");
            return;
          }
          await createCategory.mutateAsync(input);
          router.push("/categories?created=1");
        }}
      />
    </div>
  );
}
