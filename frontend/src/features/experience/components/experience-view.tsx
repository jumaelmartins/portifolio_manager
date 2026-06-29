"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperienceEntry } from "../types";
import { DeleteExperienceDialog } from "./delete-experience-dialog";
import { ExperienceMobileList } from "./experience-mobile-list";
import { ExperienceTable } from "./experience-table";

type ExperienceViewProps = {
  entries: ExperienceEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: ExperienceEntry) => Promise<void>;
};

function sortByStartDateDesc(entries: ExperienceEntry[]) {
  return [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

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
  isPending,
  error,
  onRetry,
  onDelete,
}: ExperienceViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<ExperienceEntry | null>(null);

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

  const sorted = sortByStartDateDesc(entries);

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
          <ExperienceTable entries={sorted} onDelete={setEntryToDelete} />
          <ExperienceMobileList entries={sorted} onDelete={setEntryToDelete} />
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </>
      )}

      <DeleteExperienceDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
