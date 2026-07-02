"use client";

import { useEffect, useState } from "react";
import { Code2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TechnologyEntry } from "../types";
import { DeleteTechnologyDialog } from "./delete-technology-dialog";
import { TechnologyMobileList } from "./technology-mobile-list";
import { TechnologyTable } from "./technology-table";

type TechnologyViewProps = {
  entries: TechnologyEntry[];
  isPending: boolean;
  error: Error | null;
  canDelete?: boolean;
  onRetry: () => void;
  onDelete: (entry: TechnologyEntry) => Promise<void>;
};

function sortByName(entries: TechnologyEntry[]) {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

function TechnologySkeleton() {
  return (
    <div role="status" aria-label="Loading technologies" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function TechnologyView({
  entries,
  isPending,
  error,
  canDelete = true,
  onRetry,
  onDelete,
}: TechnologyViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<TechnologyEntry | null>(null);

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Technology created successfully" : "Technology updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/technologies?${qs}` : "/technologies", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <TechnologySkeleton />;
  if (error) {
    return (
      <ErrorState title="Technologies unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  const sorted = sortByName(entries);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Technologies
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the technology tags attached to your projects.
          </p>
        </div>
        <Link href="/technologies/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Technology
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No technologies yet"
          description="Add your first technology to start tagging your projects."
          icon={<Code2 className="size-5" aria-hidden="true" />}
          action={
            <Link href="/technologies/new" className={buttonVariants({ size: "lg" })}>
              Add your first technology
            </Link>
          }
        />
      ) : (
        <>
          <TechnologyTable entries={sorted} canDelete={canDelete} onDelete={setEntryToDelete} />
          <TechnologyMobileList entries={sorted} canDelete={canDelete} onDelete={setEntryToDelete} />
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "technology" : "technologies"}
          </p>
        </>
      )}

      <DeleteTechnologyDialog
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
