"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TechnologyEntry } from "../types";

type DeleteTechnologyDialogProps = {
  entry: TechnologyEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entry: TechnologyEntry) => Promise<void>;
};

export function DeleteTechnologyDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
}: DeleteTechnologyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) setError(null);
      onOpenChange(nextOpen);
    }
  }

  async function handleDelete() {
    if (!entry) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(entry);
      onOpenChange(false);
      toast.success("Technology deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete technology";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {entry?.name ?? "technology"}?</DialogTitle>
          <DialogDescription>
            This permanently removes this technology. Projects using it must be
            updated first.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 data-icon="inline-start" />
            {isDeleting ? "Deleting..." : "Delete technology"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
