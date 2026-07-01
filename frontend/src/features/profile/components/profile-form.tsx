"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileFormValues } from "../schemas";

type ProfileFormProps = {
  defaultValues: ProfileFormValues;
  onSubmit: (input: ProfileFormValues) => Promise<void>;
};

export function ProfileForm({ defaultValues, onSubmit }: ProfileFormProps) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: ProfileFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save profile",
      });
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Profile information</CardTitle>
        <CardDescription>Update your account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              aria-label="Email"
              aria-invalid={Boolean(errors.email)}
              {...form.register("email")}
            />
            <FieldErrors error={errors.email} id="profile-email-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input
              id="profile-username"
              aria-label="Username"
              aria-invalid={Boolean(errors.username)}
              {...form.register("username")}
            />
            <FieldErrors error={errors.username} id="profile-username-error" />
          </div>
          {errors.root?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
            {form.formState.isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
