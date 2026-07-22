"use client";

import { useEffect, useState } from "react";
import { Briefcase, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { SortableList } from "@/components/ui/sortable-list";
import { StateFilter } from "@/components/ui/state-filter";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import type { ContentState } from "@/lib/content-state";
import type { ExperienceEntry } from "../types";
import { useReorderExperiences } from "../api/experience-queries";
import { DeleteExperienceDialog } from "./delete-experience-dialog";
import { ExperienceMobileList } from "./experience-mobile-list";
import { ExperienceTable } from "./experience-table";

type ExperienceViewProps = {
  entries: ExperienceEntry[];
  state: ContentState;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onArchive: (entry: ExperienceEntry) => void;
  onUnarchive: (entry: ExperienceEntry) => void;
  onRestore: (entry: ExperienceEntry) => void;
  onSoftDelete: (entry: ExperienceEntry) => void;
  onPurge: (entry: ExperienceEntry) => Promise<void>;
};

const EXPERIENCE_SORTS: SortOption<ExperienceEntry>[] = [
  { key: "recent", label: "Newest start", compare: (a, b) => b.startDate.localeCompare(a.startDate) },
  { key: "oldest", label: "Oldest start", compare: (a, b) => a.startDate.localeCompare(b.startDate) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
  { key: "order", label: "Manual order", compare: (a, b) => a.order - b.order },
];

function ExperienceSkeleton() {
  return (
    <div role="status" aria-label="Loading experience" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function ExperienceView({
  entries,
  state,
  isPending,
  error,
  onRetry,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ExperienceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToPurge, setEntryToPurge] = useState<ExperienceEntry | null>(null);

  const controls = useListControls<ExperienceEntry>({
    items: entries,
    basePath: "/experience",
    searchAccessor: (entry) => `${entry.title} ${entry.companyName}`,
    sorts: EXPERIENCE_SORTS,
    defaultState: "active",
  });

  const sortOptions =
    state === "active" ? EXPERIENCE_SORTS : EXPERIENCE_SORTS.filter((s) => s.key !== "order");
  const isManual = state === "active" && controls.sortKey === "order";

  const reorder = useReorderExperiences();

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Experience created successfully" : "Experience updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/experience?${qs}` : "/experience", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <ExperienceSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Experience unavailable"
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
            Experience
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage work experience displayed in your public portfolio.
          </p>
        </div>
        <Link href="/experience/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Experience
        </Link>
      </header>

      <StateFilter value={state} onChange={(next) => controls.setState(next)} />

      {entries.length === 0 ? (
        <EmptyState
          title="No experience yet"
          description="Add your first work experience to start building your career history."
          icon={<Briefcase className="size-5" aria-hidden="true" />}
          action={
            <Link href="/experience/new" className={buttonVariants({ size: "lg" })}>
              Add your first experience
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
                placeholder="Search experience..."
              />
            )}
            <SortSelect
              value={controls.sortKey}
              options={sortOptions}
              onValueChange={controls.setSortKey}
            />
          </div>
          {isManual ? (
            <SortableList
              items={controls.sortedItems}
              onReorder={(ids) => reorder.mutate(ids)}
              getLabel={(entry) => entry.title}
            >
              {(entry) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{entry.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {entry.companyName}
                    </p>
                  </div>
                  <Link
                    href={`/experience/${entry.id}/edit`}
                    aria-label={`Edit ${entry.title}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                  >
                    <Pencil />
                  </Link>
                </div>
              )}
            </SortableList>
          ) : controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching experience"
              description="Adjust or clear the search to see more entries."
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
              <ExperienceTable
                entries={controls.pageItems}
                state={state}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onRestore={onRestore}
                onSoftDelete={onSoftDelete}
                onPurge={(entry) => setEntryToPurge(entry)}
              />
              <ExperienceMobileList
                entries={controls.pageItems}
                state={state}
                onArchive={onArchive}
                onUnarchive={onUnarchive}
                onRestore={onRestore}
                onSoftDelete={onSoftDelete}
                onPurge={(entry) => setEntryToPurge(entry)}
              />
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

      <DeleteExperienceDialog
        entry={entryToPurge}
        open={entryToPurge !== null}
        onOpenChange={(open) => { if (!open) setEntryToPurge(null); }}
        onConfirm={onPurge}
      />
    </div>
  );
}
