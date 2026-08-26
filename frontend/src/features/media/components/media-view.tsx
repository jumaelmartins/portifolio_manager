"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaImage } from "../types";
import { MediaCard } from "./media-card";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

type MediaViewProps = {
  images: MediaImage[];
  isPending: boolean;
  error: unknown;
  onRetry: () => void;
  onUpload: (file: File) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  onUpdateDescription: (id: number, description: string) => Promise<unknown>;
};

function isUnused(image: MediaImage) {
  return image.usage.projects.length === 0 && !image.usage.isProfilePicture;
}

function MediaSkeleton() {
  return (
    <div role="status" aria-label="Loading media" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-32 sm:block" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function MediaView({
  images,
  isPending,
  error,
  onRetry,
  onUpload,
  onDelete,
  onUpdateDescription,
}: MediaViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or GIF images are allowed");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      toast.success("Image uploaded");
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String((caught as { message: unknown }).message)
          : "Unable to upload image";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  if (isPending) {
    return <MediaSkeleton />;
  }

  if (error) {
    const description =
      error instanceof Error
        ? error.message
        : "Something went wrong while loading your media library.";
    return (
      <ErrorState
        title="Media unavailable"
        description={description}
        onRetry={onRetry}
      />
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = images.filter((image) => {
    const matchesQuery =
      normalizedQuery === "" ||
      (image.description ?? "").toLowerCase().includes(normalizedQuery);
    const matchesUnused = !unusedOnly || isUnused(image);
    return matchesQuery && matchesUnused;
  });

  const uploadButton = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="lg"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload data-icon="inline-start" />
        {isUploading ? "Uploading..." : "Upload image"}
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Media
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the images used across your portfolio.
          </p>
        </div>
        {uploadButton}
      </header>

      {images.length === 0 ? (
        <EmptyState
          title="No images yet"
          description="Upload your first image to start building your media library."
          icon={<ImagePlus className="size-5" aria-hidden="true" />}
          action={
            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Upload your first image
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by description..."
            />
            <Label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2">
              <Checkbox
                checked={unusedOnly}
                onCheckedChange={(checked) => setUnusedOnly(checked === true)}
              />
              Unused only
            </Label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No matching images"
              description="Adjust your search or filters to see more images."
              action={
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setQuery("");
                    setUnusedOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((image) => (
                <MediaCard
                  key={image.id}
                  image={image}
                  onDelete={onDelete}
                  onUpdateDescription={onUpdateDescription}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
