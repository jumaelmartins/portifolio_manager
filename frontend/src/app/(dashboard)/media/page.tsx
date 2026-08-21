"use client";

import { Suspense } from "react";

import {
  useDeleteImage,
  useMediaImages,
  useUpdateImageDescription,
  useUploadImage,
} from "@/features/media/api/media-queries";
import { MediaView } from "@/features/media/components/media-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading media" className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
        </div>
      }
    >
      <MediaPageContent />
    </Suspense>
  );
}

function MediaPageContent() {
  const images = useMediaImages();
  const upload = useUploadImage();
  const remove = useDeleteImage();
  const updateDescription = useUpdateImageDescription();

  return (
    <MediaView
      images={images.data ?? []}
      isPending={images.isPending}
      error={images.error}
      onRetry={() => {
        void images.refetch();
      }}
      onUpload={(file) => upload.mutateAsync(file)}
      onDelete={(id) => remove.mutateAsync(id)}
      onUpdateDescription={(id, description) =>
        updateDescription.mutateAsync({ id, description })
      }
    />
  );
}
