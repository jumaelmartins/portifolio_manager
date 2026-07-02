"use client";

import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useDeleteCategory,
} from "@/features/categories/api/category-queries";
import { CategoryView } from "@/features/categories/components/category-view";

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading categories" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  );
}

function CategoriesPageContent() {
  const categories = useCategories();
  const deleteCategory = useDeleteCategory();

  return (
    <CategoryView
      entries={categories.data ?? []}
      isPending={categories.isPending}
      error={categories.error}
      onRetry={() => void categories.refetch()}
      onDelete={async (entry) => {
        await deleteCategory.mutateAsync(entry.id);
      }}
    />
  );
}
