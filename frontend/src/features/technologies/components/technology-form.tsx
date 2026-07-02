"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { FieldErrors } from "@/features/auth/components/field-errors";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { technologySchema } from "../schemas";
import type { TechnologyInput } from "../types";

type TechnologyFormProps = {
  mode: "create" | "edit";
  defaultValues?: TechnologyInput;
  onSubmit: (input: TechnologyInput) => Promise<void>;
};

const emptyValues: TechnologyInput = { name: "" };

export function TechnologyForm({
  mode,
  defaultValues = emptyValues,
  onSubmit,
}: TechnologyFormProps) {
  const form = useForm<TechnologyInput>({
    resolver: zodResolver(technologySchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: TechnologyInput) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save technology",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Technology details</CardTitle>
            <CardDescription>
              Technologies are the skill tags attached to your projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="technology-name">Name</Label>
              <Input
                id="technology-name"
                aria-label="Name"
                aria-invalid={Boolean(errors.name)}
                {...form.register("name")}
              />
              <FieldErrors error={errors.name} id="technology-name-error" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/75">
          <CardContent className="space-y-3">
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {form.formState.isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Technology"
                  : "Save Changes"}
            </Button>
            <Link
              href="/technologies"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 w-full",
              })}
            >
              Cancel
            </Link>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
