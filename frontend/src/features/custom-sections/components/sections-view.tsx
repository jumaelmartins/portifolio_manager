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
import { SortableList } from "@/components/ui/sortable-list";
import { StateFilter } from "@/components/ui/state-filter";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { ContentState } from "@/lib/content-state";
import { useReorderSections } from "../api/custom-sections-queries";
import type { CustomSection } from "../types";
import { DeleteSectionDialog } from "./delete-section-dialog";
import { ItemsDrawer } from "./items-drawer";
import { SectionCard } from "./section-card";

type SectionsViewProps = {
  sections: CustomSection[];
  state: ContentState;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onArchive: (section: CustomSection) => void;
  onUnarchive: (section: CustomSection) => void;
  onRestore: (section: CustomSection) => void;
  onSoftDelete: (section: CustomSection) => void;
  onPurge: (section: CustomSection) => Promise<void>;
};

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

export function SectionsView({
  sections,
  state,
  isPending,
  error,
  onRetry,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: SectionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [sectionToPurge, setSectionToPurge] = useState<CustomSection | null>(null);

  const controls = useListControls<CustomSection>({
    items: sections,
    basePath: "/custom-sections",
    searchAccessor: (section) => `${section.name} ${section.description ?? ""}`,
    sorts: SECTION_SORTS,
    defaultState: "active",
  });

  // Manual order is the default sort for sections, but only meaningful in Active:
  // useListControls.setState always resets sortKey to the default ("order"), so
  // Archived/Trash can land on sortKey "order" even though "Manual order" isn't
  // one of their SortSelect options. Gate reorder on state === "active" and fall
  // back the *displayed* SortSelect value to the first non-manual option so the
  // control never shows a value that isn't in its own options list.
  const sortOptions =
    state === "active" ? SECTION_SORTS : SECTION_SORTS.filter((s) => s.key !== "order");
  const isManual = state === "active" && controls.sortKey === "order";
  const sortSelectValue =
    state !== "active" && controls.sortKey === "order" ? sortOptions[0].key : controls.sortKey;

  const reorder = useReorderSections();
  const activeSection = sections.find((s) => s.id === activeSectionId) ?? null;

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

  if (isPending) {
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

  if (error) {
    return (
      <ErrorState
        title="Custom sections unavailable"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

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

      <StateFilter value={state} onChange={(next) => controls.setState(next)} />

      {sections.length === 0 ? (
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
            {!isManual && (
              <SearchInput
                value={controls.query}
                onChange={controls.setQuery}
                placeholder="Search sections..."
              />
            )}
            <SortSelect
              value={sortSelectValue}
              options={sortOptions}
              onValueChange={controls.setSortKey}
            />
          </div>
          {isManual ? (
            <SortableList
              items={controls.sortedItems}
              onReorder={(ids) => reorder.mutate(ids)}
              getLabel={(section) => section.name}
              itemClassName="border-0 bg-transparent p-0"
            >
              {(section) => (
                <SectionCard
                  section={section}
                  state={state}
                  onManageItems={setActiveSectionId}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onRestore={onRestore}
                  onSoftDelete={onSoftDelete}
                  onPurge={(s) => setSectionToPurge(s)}
                />
              )}
            </SortableList>
          ) : controls.totalFiltered === 0 ? (
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
                    state={state}
                    onManageItems={setActiveSectionId}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onRestore={onRestore}
                    onSoftDelete={onSoftDelete}
                    onPurge={(s) => setSectionToPurge(s)}
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
        section={sectionToPurge}
        open={sectionToPurge !== null}
        onOpenChange={(open) => {
          if (!open) setSectionToPurge(null);
        }}
        onConfirm={onPurge}
      />
    </div>
  );
}
