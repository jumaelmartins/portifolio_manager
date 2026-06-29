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
import { courseSchema } from "../schemas";
import type { CourseInput } from "../types";

type CourseFormProps = {
  mode: "create" | "edit";
  defaultValues?: CourseInput;
  onSubmit: (input: CourseInput) => Promise<void>;
};

const emptyValues: CourseInput = {
  title: "",
  institutionName: "",
  description: "",
  startDate: "",
  endDate: "",
  current: false,
};

export function CourseForm({
  mode,
  defaultValues = emptyValues,
  onSubmit,
}: CourseFormProps) {
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
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

  async function submit(values: CourseInput) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save course",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="space-y-6 max-w-2xl">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Course details</CardTitle>
            <CardDescription>
              Courses and certifications displayed in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crs-title">Course title</Label>
                <Input
                  id="crs-title"
                  aria-label="Course title"
                  aria-invalid={Boolean(errors.title)}
                  {...form.register("title")}
                />
                <FieldErrors error={errors.title} id="crs-title-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crs-institution">Institution</Label>
                <Input
                  id="crs-institution"
                  aria-label="Institution"
                  aria-invalid={Boolean(errors.institutionName)}
                  {...form.register("institutionName")}
                />
                <FieldErrors error={errors.institutionName} id="crs-institution-error" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crs-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="crs-description"
                aria-label="Description"
                rows={4}
                className="min-h-24 resize-y"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crs-start">Start date</Label>
                <Input
                  id="crs-start"
                  type="date"
                  aria-label="Start date"
                  aria-invalid={Boolean(errors.startDate)}
                  {...form.register("startDate")}
                />
                <FieldErrors error={errors.startDate} id="crs-start-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crs-end">End date</Label>
                <Input
                  id="crs-end"
                  type="date"
                  aria-label="End date"
                  disabled={current}
                  aria-invalid={Boolean(errors.endDate)}
                  {...form.register("endDate")}
                />
                <FieldErrors error={errors.endDate} id="crs-end-error" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="crs-current"
                type="checkbox"
                className="h-4 w-4 rounded border border-input accent-primary"
                aria-label="Currently enrolled"
                {...form.register("current")}
              />
              <Label htmlFor="crs-current">Currently enrolled</Label>
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
                  ? "Create Course"
                  : "Save Changes"}
            </Button>
            <Link
              href="/courses"
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
