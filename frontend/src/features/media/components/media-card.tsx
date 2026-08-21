"use client";

import { useId, useState } from "react";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MediaImage } from "../types";

type MediaCardProps = {
  image: MediaImage;
  onDelete: (id: number) => Promise<unknown>;
  onUpdateDescription: (id: number, description: string) => Promise<unknown>;
};

function extractMessage(caught: unknown, fallback: string) {
  return caught && typeof caught === "object" && "message" in caught
    ? String((caught as { message: unknown }).message)
    : fallback;
}

function filenameFromUrl(url: string) {
  return url.split("/").pop() ?? url;
}

export function MediaCard({
  image,
  onDelete,
  onUpdateDescription,
}: MediaCardProps) {
  const descriptionFieldId = useId();
  const filename = filenameFromUrl(image.url);
  const projectCount = image.usage.projects.length;
  const hasDescription = Boolean(image.description?.trim());

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(image.description ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function startEditing() {
    setDraft(image.description ?? "");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(image.description ?? "");
  }

  async function saveDescription() {
    setIsSaving(true);
    try {
      await onUpdateDescription(image.id, draft.trim());
      setIsEditing(false);
      toast.success("Description updated");
    } catch (caught) {
      toast.error(extractMessage(caught, "Unable to update description"));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isDeleting) {
      return;
    }
    if (!nextOpen) {
      setDeleteError(null);
    }
    setIsDialogOpen(nextOpen);
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(image.id);
      setIsDialogOpen(false);
      toast.success("Image deleted");
    } catch (caught) {
      const message = extractMessage(caught, "Unable to delete image");
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card size="sm" className="gap-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={hasDescription ? (image.description as string) : filename}
        className="aspect-video w-full bg-muted object-cover"
      />
      <CardContent className="flex flex-1 flex-col gap-3 pt-3">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor={descriptionFieldId}>Description</Label>
            <Textarea
              id={descriptionFieldId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe this image"
              className="min-h-20"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveDescription} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm leading-snug">
              {hasDescription ? (
                image.description
              ) : (
                <span className="text-muted-foreground italic">
                  No description
                </span>
              )}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit description"
                onClick={startEditing}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete image"
                onClick={() => setIsDialogOpen(true)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {projectCount > 0 ? (
            <Badge variant="secondary">{projectCount} project(s)</Badge>
          ) : null}
          {image.usage.isProfilePicture ? (
            <Badge variant="secondary">Profile</Badge>
          ) : null}
          {projectCount === 0 && !image.usage.isProfilePicture ? (
            <Badge variant="outline">Unused</Badge>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="justify-start gap-1.5 py-2">
        <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span
          className="truncate font-mono text-xs text-muted-foreground"
          title={filename}
        >
          {filename}
        </span>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete image?</DialogTitle>
            <DialogDescription>
              This permanently removes the image from your library. Images in use
              by a project or your profile cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={isDeleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              <Trash2 data-icon="inline-start" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
