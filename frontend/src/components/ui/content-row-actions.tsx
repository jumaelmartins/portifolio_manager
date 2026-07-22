"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentState } from "@/lib/content-state";

type ContentRowActionsProps = {
  state: ContentState;
  label: string;
  onArchive: () => void;
  onUnarchive: () => void;
  onRestore: () => void;
  onSoftDelete: () => void;
  onPurge: () => void;
} & ({ editHref: string; onEdit?: never } | { onEdit: () => void; editHref?: never });

export function ContentRowActions({
  state,
  label,
  editHref,
  onEdit,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ContentRowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {state !== "trash" &&
        (onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${label}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
        ) : (
          <Link
            href={editHref}
            aria-label={`Edit ${label}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Pencil />
          </Link>
        ))}

      {state === "active" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Archive ${label}`}
          onClick={onArchive}
        >
          <Archive />
        </Button>
      )}

      {state === "archived" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Unarchive ${label}`}
          onClick={onUnarchive}
        >
          <ArchiveRestore />
        </Button>
      )}

      {state === "trash" ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Restore ${label}`}
            onClick={onRestore}
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${label} permanently`}
            className="text-muted-foreground hover:text-destructive"
            onClick={onPurge}
          >
            <Trash2 />
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${label} to trash`}
          className="text-muted-foreground hover:text-destructive"
          onClick={onSoftDelete}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
