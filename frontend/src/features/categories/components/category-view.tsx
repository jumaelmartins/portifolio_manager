"use client";

import { useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
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
import type { CategoryEntry } from "../types";
import { CategoryMobileList } from "./category-mobile-list";
import { CategoryTable } from "./category-table";
import { DeleteCategoryDialog } from "./delete-category-dialog";

type CategoryViewProps = {
  entries: CategoryEntry[];
  isPending: boolean;
  error: Error | null;
  canDelete?: boolean;
  onRetry: () => void;
  onDelete: (entry: CategoryEntry) => Promise<void>;
};

const CATEGORY_SORTS: SortOption<CategoryEntry>[] = [
  { key: "name-asc", label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "name-desc", label: "Name Z–A", compare: (a, b) => b.name.localeCompare(a.name) },
];

function CategorySkeleton() {
  return (
    <div role="status" aria-label="Loading categories" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function CategoryView({
  entries,
  isPending,
  error,
  canDelete = true,
  onRetry,
  onDelete,
}: CategoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<CategoryEntry | null>(null);

  const controls = useListControls<CategoryEntry>({
    items: entries,
    basePath: "/categories",
    searchAccessor: (entry) => entry.name,
    sorts: CATEGORY_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Category created successfully" : "Category updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/categories?${qs}` : "/categories", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <CategorySkeleton />;
  if (error) {
    return (
      <ErrorState title="Categories unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Categories
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the categories used to group your projects.
          </p>
        </div>
        <Link href="/categories/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Category
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add your first category to start organizing your projects."
          icon={<Tags className="size-5" aria-hidden="true" />}
          action={
            <Link href="/categories/new" className={buttonVariants({ size: "lg" })}>
              Add your first category
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search categories..."
            />
            <SortSelect
              value={controls.sortKey}
              options={CATEGORY_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching categories"
              description="Adjust or clear the search to see more categories."
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
              <CategoryTable entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
              <CategoryMobileList entries={controls.pageItems} canDelete={canDelete} onDelete={setEntryToDelete} />
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

      <DeleteCategoryDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setEntryToDelete(null);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
