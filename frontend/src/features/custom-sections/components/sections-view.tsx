// frontend/src/features/custom-sections/components/sections-view.tsx
"use client";

import { Blocks, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useDeleteSection, useSections } from "../api/custom-sections-queries";
import type { CustomSection } from "../types";
import { DeleteSectionDialog } from "./delete-section-dialog";
import { ItemsDrawer } from "./items-drawer";
import { SectionCard } from "./section-card";

const SECTION_SORTS: SortOption<CustomSection>[] = [
  {
    key: "order",
    label: "Manual order",
    compare: (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
  },
  { key: "name-asc", label: "Name A–Z", compare: (a, b) => a.name.localeCompare(b.name) },
  { key: "name-desc", label: "Name Z–A", compare: (a, b) => b.name.localeCompare(a.name) },
];

export function SectionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sections = useSections();
  const deleteSection = useDeleteSection();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<CustomSection | null>(null);

  const controls = useListControls<CustomSection>({
    items: sections.data ?? [],
    basePath: "/custom-sections",
    searchAccessor: (section) => `${section.name} ${section.description ?? ""}`,
    sorts: SECTION_SORTS,
  });

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Section created successfully" : "Section updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/custom-sections?${qs}` : "/custom-sections", { scroll: false });
  }, [router, searchParams]);

  if (sections.isPending) {
    return (
      <div role="status" aria-label="Loading custom sections" className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (sections.error) {
    return (
      <ErrorState
        title="Custom sections unavailable"
        description={sections.error.message}
        onRetry={() => void sections.refetch()}
      />
    );
  }

  const data = sections.data ?? [];
  const activeSection = data.find((s) => s.id === activeSectionId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Custom Sections
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Build custom sections with your own fields and items.
          </p>
        </div>
        <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Section
        </Link>
      </header>

      {data.length === 0 ? (
        <EmptyState
          title="No custom sections yet"
          description="Create your first custom section to add tailored content to your portfolio."
          icon={<Blocks className="size-5" aria-hidden="true" />}
          action={
            <Link href="/custom-sections/new" className={buttonVariants({ size: "lg" })}>
              Add your first section
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={controls.query}
              onChange={controls.setQuery}
              placeholder="Search sections..."
            />
            <SortSelect
              value={controls.sortKey}
              options={SECTION_SORTS}
              onValueChange={controls.setSortKey}
            />
          </div>
          {controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching sections"
              description="Adjust or clear the search to see more sections."
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
              <div className="grid gap-4 sm:grid-cols-2">
                {controls.pageItems.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onManageItems={setActiveSectionId}
                    onDelete={setSectionToDelete}
                  />
                ))}
              </div>
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

      <ItemsDrawer
        section={activeSection}
        open={activeSectionId !== null}
        onOpenChange={(open) => {
          if (!open) setActiveSectionId(null);
        }}
      />

      <DeleteSectionDialog
        section={sectionToDelete}
        open={sectionToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSectionToDelete(null);
        }}
        onConfirm={async (section) => {
          await deleteSection.mutateAsync(section.id);
        }}
      />
    </div>
  );
}
