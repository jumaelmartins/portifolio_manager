"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "../api/profile-queries";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { ProfilePictureUpload } from "./profile-picture-upload";

export function ProfileView() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  if (profile.isPending) {
    return (
      <div role="status" aria-label="Loading profile" className="max-w-2xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (profile.error || !profile.data) {
    return (
      <ErrorState
        title="Profile unavailable"
        description={profile.error?.message ?? "Your profile could not be loaded."}
        onRetry={() => void profile.refetch()}
      />
    );
  }

  const data = profile.data;

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Profile & Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Manage your account details, photo, and password.
        </p>
      </header>

      <ProfilePictureUpload profilePicture={data.profilePicture} email={data.email} />

      <ProfileForm
        defaultValues={{ email: data.email, username: data.username ?? "" }}
        onSubmit={async (values) => {
          await updateProfile.mutateAsync({
            email: values.email,
            username: values.username ?? "",
          });
          toast.success("Profile updated");
        }}
      />

      <PasswordForm
        onSubmit={async (values) => {
          await changePassword.mutateAsync({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
        }}
      />
    </div>
  );
}
