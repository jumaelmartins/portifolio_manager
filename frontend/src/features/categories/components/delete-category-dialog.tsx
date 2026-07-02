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
import type { CategoryEntry } from "../types";

type DeleteCategoryDialogProps = {
  entry: CategoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entry: CategoryEntry) => Promise<void>;
};

export function DeleteCategoryDialog({
  entry,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCategoryDialogProps) {
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
      toast.success("Category deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete category";
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
          <DialogTitle>Delete {entry?.name ?? "category"}?</DialogTitle>
          <DialogDescription>
            This permanently removes this category. Projects using it must be
            reassigned first.
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
            {isDeleting ? "Deleting..." : "Delete category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
