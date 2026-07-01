"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { passwordSchema, type PasswordFormValues } from "../schemas";

type PasswordFormProps = {
  onSubmit: (input: PasswordFormValues) => Promise<void>;
};

const emptyValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordForm({ onSubmit }: PasswordFormProps) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: emptyValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: PasswordFormValues) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
      form.reset(emptyValues);
      toast.success("Password updated");
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to update password",
      });
    }
  }

  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password used to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="pw-current">Current password</Label>
            <Input
              id="pw-current"
              type="password"
              aria-label="Current password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...form.register("currentPassword")}
            />
            <FieldErrors error={errors.currentPassword} id="pw-current-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-new">New password</Label>
            <Input
              id="pw-new"
              type="password"
              aria-label="New password"
              aria-invalid={Boolean(errors.newPassword)}
              {...form.register("newPassword")}
            />
            <FieldErrors error={errors.newPassword} id="pw-new-error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw-confirm">Confirm new password</Label>
            <Input
              id="pw-confirm"
              type="password"
              aria-label="Confirm new password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...form.register("confirmPassword")}
            />
            <FieldErrors error={errors.confirmPassword} id="pw-confirm-error" />
          </div>
          {errors.root?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
            {form.formState.isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
