// frontend/src/features/custom-sections/components/delete-section-dialog.tsx
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
import type { CustomSection } from "../types";

type DeleteSectionDialogProps = {
  section: CustomSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (section: CustomSection) => Promise<void>;
};

export function DeleteSectionDialog({ section, open, onOpenChange, onConfirm }: DeleteSectionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) setError(null);
      onOpenChange(nextOpen);
    }
  }

  async function handleDelete() {
    if (!section) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(section);
      onOpenChange(false);
      toast.success("Section deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete section";
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
          <DialogTitle>Delete {section?.name ?? "section"}?</DialogTitle>
          <DialogDescription>
            This permanently removes the section and all of its items from your portfolio.
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
            {isDeleting ? "Deleting..." : "Delete section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
