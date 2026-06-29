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
import { educationSchema } from "../schemas";
import type { EducationInput } from "../types";

type EducationFormProps = {
  mode: "create" | "edit";
  defaultValues?: EducationInput;
  onSubmit: (input: EducationInput) => Promise<void>;
};

const emptyValues: EducationInput = {
  title: "",
  institutionName: "",
  description: "",
  startDate: "",
  endDate: "",
  current: false,
};

export function EducationForm({
  mode,
  defaultValues = emptyValues,
  onSubmit,
}: EducationFormProps) {
  const form = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
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

  async function submit(values: EducationInput) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save education",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Education details</CardTitle>
            <CardDescription>
              Education history displayed in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-title">Degree / title</Label>
                <Input
                  id="edu-title"
                  aria-label="Degree / title"
                  aria-invalid={Boolean(errors.title)}
                  {...form.register("title")}
                />
                <FieldErrors error={errors.title} id="edu-title-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-institution">Institution</Label>
                <Input
                  id="edu-institution"
                  aria-label="Institution"
                  aria-invalid={Boolean(errors.institutionName)}
                  {...form.register("institutionName")}
                />
                <FieldErrors error={errors.institutionName} id="edu-institution-error" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="edu-description"
                aria-label="Description"
                rows={4}
                className="min-h-24 resize-y"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-start">Start date</Label>
                <Input
                  id="edu-start"
                  type="date"
                  aria-label="Start date"
                  aria-invalid={Boolean(errors.startDate)}
                  {...form.register("startDate")}
                />
                <FieldErrors error={errors.startDate} id="edu-start-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-end">End date</Label>
                <Input
                  id="edu-end"
                  type="date"
                  aria-label="End date"
                  disabled={current}
                  aria-invalid={Boolean(errors.endDate)}
                  {...form.register("endDate")}
                />
                <FieldErrors error={errors.endDate} id="edu-end-error" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edu-current"
                type="checkbox"
                className="h-4 w-4 rounded border border-input accent-primary"
                aria-label="Currently studying here"
                {...form.register("current")}
              />
              <Label htmlFor="edu-current">Currently studying here</Label>
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
                  ? "Create Education"
                  : "Save Changes"}
            </Button>
            <Link
              href="/education"
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
