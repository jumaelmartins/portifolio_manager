"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EducationEntry } from "../types";
import { DeleteEducationDialog } from "./delete-education-dialog";
import { EducationMobileList } from "./education-mobile-list";
import { EducationTable } from "./education-table";

type EducationViewProps = {
  entries: EducationEntry[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (entry: EducationEntry) => Promise<void>;
};

function sortByStartDateDesc(entries: EducationEntry[]) {
  return [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

function EducationSkeleton() {
  return (
    <div role="status" aria-label="Loading education" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="hidden h-10 w-36 sm:block" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}

export function EducationView({
  entries,
  isPending,
  error,
  onRetry,
  onDelete,
}: EducationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entryToDelete, setEntryToDelete] = useState<EducationEntry | null>(null);

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) return;
    toast.success(created ? "Education created successfully" : "Education updated successfully");
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const qs = nextParams.toString();
    router.replace(qs ? `/education?${qs}` : "/education", { scroll: false });
  }, [router, searchParams]);

  if (isPending) return <EducationSkeleton />;
  if (error) {
    return (
      <ErrorState title="Education unavailable" description={error.message} onRetry={onRetry} />
    );
  }

  const sorted = sortByStartDateDesc(entries);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Education
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage education history displayed in your public portfolio.
          </p>
        </div>
        <Link href="/education/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          Add Education
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="No education yet"
          description="Add your first education entry to showcase your academic background."
          icon={<GraduationCap className="size-5" aria-hidden="true" />}
          action={
            <Link href="/education/new" className={buttonVariants({ size: "lg" })}>
              Add your first education
            </Link>
          }
        />
      ) : (
        <>
          <EducationTable entries={sorted} onDelete={setEntryToDelete} />
          <EducationMobileList entries={sorted} onDelete={setEntryToDelete} />
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </>
      )}

      <DeleteEducationDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
        onConfirm={onDelete}
      />
    </div>
  );
}
