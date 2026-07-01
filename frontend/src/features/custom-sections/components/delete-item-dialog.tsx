// frontend/src/features/custom-sections/components/delete-item-dialog.tsx
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
import type { CustomItem } from "../types";

type DeleteItemDialogProps = {
  item: CustomItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: CustomItem) => Promise<void>;
};

export function DeleteItemDialog({ item, open, onOpenChange, onConfirm }: DeleteItemDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) setError(null);
      onOpenChange(nextOpen);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(item);
      onOpenChange(false);
      toast.success("Item deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete item";
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
          <DialogTitle>Delete this item?</DialogTitle>
          <DialogDescription>This permanently removes the item from the section.</DialogDescription>
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
            {isDeleting ? "Deleting..." : "Delete item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
