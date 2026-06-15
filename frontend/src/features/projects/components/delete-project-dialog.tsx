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
import type { Project } from "../types";

type DeleteProjectDialogProps = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (project: Project) => Promise<void>;
};

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      if (!nextOpen) {
        setError(null);
      }
      onOpenChange(nextOpen);
    }
  }

  async function deleteProject() {
    if (!project) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(project);
      onOpenChange(false);
      toast.success("Project deleted");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to delete project";
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
          <DialogTitle>Delete {project?.title ?? "project"}?</DialogTitle>
          <DialogDescription>
            This action permanently removes the project from your portfolio.
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
          <Button
            variant="destructive"
            onClick={deleteProject}
            disabled={isDeleting}
          >
            <Trash2 data-icon="inline-start" />
            {isDeleting ? "Deleting..." : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
