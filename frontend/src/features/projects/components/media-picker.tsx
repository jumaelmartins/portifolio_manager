"use client";

import { Check, ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImageOption } from "../types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

type MediaPickerProps = {
  images: ImageOption[];
  value: number | null;
  onChange: (value: number | null) => void;
  onUpload: (file: File) => Promise<ImageOption>;
};

export function MediaPicker({
  images: initialImages,
  value,
  onChange,
  onUpload,
}: MediaPickerProps) {
  const inputId = useId();
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) {
      return;
    }
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG, and GIF images are supported");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5 MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const image = await onUpload(file);
      setImages((current) => [
        image,
        ...current.filter((item) => item.id !== image.id),
      ]);
      onChange(image.id);
    } catch (caught) {
      setError(
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to upload image",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Choose an existing image or upload a new one.
        </p>
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground outline-none hover:bg-secondary/80 focus-within:ring-2 focus-within:ring-ring",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isUploading ? "Uploading..." : "Upload image"}
          <input
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
            className="sr-only"
            aria-label="Upload image"
            disabled={isUploading}
            onChange={(event) => {
              void upload(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {images.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image) => {
            const label = image.description || "Portfolio media";
            const selected = value === image.id;
            return (
              <Button
                key={image.id}
                type="button"
                variant="outline"
                aria-label={`Select ${label}`}
                aria-pressed={selected}
                className={cn(
                  "relative aspect-video h-auto overflow-hidden bg-muted bg-cover bg-center p-0",
                  selected && "border-primary ring-2 ring-primary/40",
                )}
                style={{ backgroundImage: `url("${image.url}")` }}
                onClick={() => onChange(selected ? null : image.id)}
              >
                <span className="sr-only">{label}</span>
                {selected ? (
                  <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" />
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
          <span>
            <ImageIcon className="mx-auto mb-2 size-5" />
            No images uploaded yet.
          </span>
        </div>
      )}
    </div>
  );
}
