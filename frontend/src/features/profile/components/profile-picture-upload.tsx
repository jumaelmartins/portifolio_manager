"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUploadProfilePicture } from "../api/profile-queries";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

type ProfilePictureUploadProps = {
  profilePicture: { id: number; url: string } | null;
  email: string;
};

export function ProfilePictureUpload({ profilePicture, email }: ProfilePictureUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProfilePicture();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Only JPEG, PNG, and GIF images are supported");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be 5 MB or smaller");
      return;
    }
    try {
      await upload.mutateAsync(file);
    } catch (caught) {
      setError(
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to upload image",
      );
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
        <CardDescription>Shown alongside your public portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar size="lg">
          {profilePicture ? <AvatarImage src={profilePicture.url} alt="Profile photo" /> : null}
          <AvatarFallback>{email.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {upload.isPending ? "Uploading..." : "Change photo"}
          </Button>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={(event) => {
              void handleFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
