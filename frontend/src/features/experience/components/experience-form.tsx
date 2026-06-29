"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { experienceSchema } from "../schemas";
import type { ExperienceInput } from "../types";

type ExperienceFormProps = {
  mode: "create" | "edit";
  defaultValues?: ExperienceInput;
  onSubmit: (input: ExperienceInput) => Promise<void>;
};

const emptyValues: ExperienceInput = {
  title: "",
  companyName: "",
  description: "",
  startDate: "",
  endDate: "",
  current: false,
};

export function ExperienceForm({
  mode,
  defaultValues = emptyValues,
  onSubmit,
}: ExperienceFormProps) {
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;
  const current = form.watch("current");

  useEffect(() => {
    if (current) {
      form.setValue("endDate", "");
    }
  }, [current, form]);

  async function submit(values: ExperienceInput) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save experience",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Experience details</CardTitle>
            <CardDescription>
              Work experience displayed in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-title">Job title</Label>
                <Input
                  id="exp-title"
                  aria-label="Job title"
                  aria-invalid={Boolean(errors.title)}
                  {...form.register("title")}
                />
                <FieldErrors error={errors.title} id="exp-title-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-company">Company</Label>
                <Input
                  id="exp-company"
                  aria-label="Company"
                  aria-invalid={Boolean(errors.companyName)}
                  {...form.register("companyName")}
                />
                <FieldErrors error={errors.companyName} id="exp-company-error" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-description">Description</Label>
              <Textarea
                id="exp-description"
                aria-label="Description"
                rows={6}
                className="min-h-32 resize-y"
                aria-invalid={Boolean(errors.description)}
                {...form.register("description")}
              />
              <FieldErrors error={errors.description} id="exp-description-error" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-start">Start date</Label>
                <Input
                  id="exp-start"
                  type="date"
                  aria-label="Start date"
                  aria-invalid={Boolean(errors.startDate)}
                  {...form.register("startDate")}
                />
                <FieldErrors error={errors.startDate} id="exp-start-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-end">End date</Label>
                <Input
                  id="exp-end"
                  type="date"
                  aria-label="End date"
                  disabled={current}
                  aria-invalid={Boolean(errors.endDate)}
                  {...form.register("endDate")}
                />
                <FieldErrors error={errors.endDate} id="exp-end-error" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="exp-current"
                type="checkbox"
                className="h-4 w-4 rounded border border-input accent-primary"
                aria-label="Currently working here"
                {...form.register("current")}
              />
              <Label htmlFor="exp-current">Currently working here</Label>
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
                  ? "Create Experience"
                  : "Save Changes"}
            </Button>
            <Link
              href="/experience"
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
