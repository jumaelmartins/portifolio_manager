"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useCreateProject,
  useDeleteImage,
  useImages,
  useProject,
  useTechnologies,
  useUpdateProject,
  useUploadImage,
} from "../api/project-queries";
import type { ProjectInput } from "../types";
import { ProjectForm } from "./project-form";

type ProjectEditorProps = {
  mode: "create" | "edit";
  projectId?: number;
};

function EditorSkeleton() {
  return (
    <div role="status" aria-label="Loading project editor" className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
        <Skeleton className="h-[640px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </div>
  );
}

export function ProjectEditor({ mode, projectId = 0 }: ProjectEditorProps) {
  const router = useRouter();
  const categories = useCategories();
  const technologies = useTechnologies();
  const images = useImages();
  const project = useProject(projectId);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const uploadImage = useUploadImage();
  const deleteImageMutation = useDeleteImage();
  const editing = mode === "edit";
  const isPending =
    categories.isPending ||
    technologies.isPending ||
    images.isPending ||
    (editing && project.isPending);
  const error =
    categories.error ||
    technologies.error ||
    images.error ||
    (editing ? project.error : null);

  if (editing && (!Number.isInteger(projectId) || projectId <= 0)) {
    return (
      <ErrorState
        title="Invalid project"
        description="The requested project ID is not valid."
      />
    );
  }

  if (isPending) {
    return <EditorSkeleton />;
  }

  if (error || (editing && !project.data)) {
    return (
      <ErrorState
        title="Project editor unavailable"
        description={error?.message ?? "The project could not be loaded."}
        onRetry={() => {
          void Promise.all([
            categories.refetch(),
            technologies.refetch(),
            images.refetch(),
            ...(editing ? [project.refetch()] : []),
          ]);
        }}
      />
    );
  }

  const defaultValues: ProjectInput | undefined = project.data
    ? {
        title: project.data.title,
        description: project.data.description,
        categoryId: project.data.category.id,
        technologyIds: project.data.technologies.map(
          (technology) => technology.id,
        ),
        repositoryUrl: project.data.repositoryUrl ?? "",
        liveUrl: project.data.liveUrl ?? "",
        coverImageId: project.data.coverImage?.id ?? null,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/projects"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to projects
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {editing ? "Edit project" : "New project"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {editing
            ? "Update the content and presentation of this portfolio project."
            : "Add a new project to your public portfolio."}
        </p>
      </header>

      <ProjectForm
        key={editing ? projectId : "new"}
        mode={mode}
        categories={categories.data ?? []}
        technologies={technologies.data ?? []}
        images={images.data ?? []}
        defaultValues={defaultValues}
        onUpload={async (file) => {
          const result = await uploadImage.mutateAsync(file);
          return result.image;
        }}
        onDelete={async (imageId) => {
          await deleteImageMutation.mutateAsync(imageId);
        }}
        onSubmit={async (input) => {
          if (editing) {
            await updateProject.mutateAsync({ id: projectId, input });
            router.push("/projects?updated=1");
            return;
          }

          await createProject.mutateAsync(input);
          router.push("/projects?created=1");
        }}
      />
    </div>
  );
}
