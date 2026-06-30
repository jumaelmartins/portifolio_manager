"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

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
import { projectSchema } from "../schemas";
import type {
  CategoryOption,
  ImageOption,
  ProjectInput,
  TechnologyOption,
} from "../types";
import { MediaPicker } from "./media-picker";
import { TechnologyMultiSelect } from "./technology-multi-select";

type ProjectFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  images: ImageOption[];
  defaultValues?: ProjectInput;
  onSubmit: (input: ProjectInput) => Promise<void>;
  onUpload: (file: File) => Promise<ImageOption>;
  onDelete?: (imageId: number) => Promise<void>;
};

const emptyProject: ProjectInput = {
  title: "",
  description: "",
  categoryId: 0,
  technologyIds: [],
  repositoryUrl: "",
  liveUrl: "",
  coverImageId: null,
};

export function ProjectForm({
  mode,
  categories,
  technologies,
  images,
  defaultValues = emptyProject,
  onSubmit,
  onUpload,
  onDelete,
}: ProjectFormProps) {
  const [technologiesOpen, setTechnologiesOpen] = useState(false);
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    criteriaMode: "all",
    shouldFocusError: true,
  });
  const errors = form.formState.errors;

  async function submit(values: ProjectInput) {
    form.clearErrors("root");
    try {
      await onSubmit(values);
    } catch (caught) {
      form.setError("root", {
        message:
          caught && typeof caught === "object" && "message" in caught
            ? String(caught.message)
            : "Unable to save project",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <Card className="bg-card/75">
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>
              Core information displayed in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                aria-label="Title"
                aria-invalid={Boolean(errors.title)}
                {...form.register("title")}
              />
              <FieldErrors error={errors.title} id="project-title-error" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                aria-label="Description"
                rows={10}
                className="min-h-52 resize-y"
                aria-invalid={Boolean(errors.description)}
                {...form.register("description")}
              />
              <FieldErrors
                error={errors.description}
                id="project-description-error"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-category">Category</Label>
                <select
                  id="project-category"
                  aria-label="Category"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-invalid={Boolean(errors.categoryId)}
                  {...form.register("categoryId", { valueAsNumber: true })}
                >
                  <option value={0}>Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <FieldErrors
                  error={errors.categoryId}
                  id="project-category-error"
                />
              </div>
              <div className="space-y-2">
                <Label>Technologies</Label>
                <Controller
                  control={form.control}
                  name="technologyIds"
                  render={({ field }) => (
                    <TechnologyMultiSelect
                      technologies={technologies}
                      value={field.value}
                      onChange={field.onChange}
                      open={technologiesOpen}
                      onOpenChange={setTechnologiesOpen}
                    />
                  )}
                />
                {errors.technologyIds?.message ? (
                  <p
                    id="project-technologies-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors.technologyIds.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-repository">Repository URL</Label>
                <Input
                  id="project-repository"
                  type="url"
                  placeholder="https://github.com/..."
                  aria-invalid={Boolean(errors.repositoryUrl)}
                  {...form.register("repositoryUrl")}
                />
                <FieldErrors
                  error={errors.repositoryUrl}
                  id="project-repository-error"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-live">Live URL</Label>
                <Input
                  id="project-live"
                  type="url"
                  placeholder="https://..."
                  aria-invalid={Boolean(errors.liveUrl)}
                  {...form.register("liveUrl")}
                />
                <FieldErrors error={errors.liveUrl} id="project-live-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/75">
            <CardHeader>
              <CardTitle>Cover image</CardTitle>
              <CardDescription>
                Select the image used to represent this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="coverImageId"
                render={({ field }) => (
                  <MediaPicker
                    images={images}
                    value={field.value}
                    onChange={field.onChange}
                    onUpload={onUpload}
                    onDelete={onDelete}
                  />
                )}
              />
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
                    ? "Create Project"
                    : "Save Changes"}
              </Button>
              <Link
                href="/projects"
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
      </div>
    </form>
  );
}
