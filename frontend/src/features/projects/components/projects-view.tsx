"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CategoryOption,
  Project,
  TechnologyOption,
} from "../types";
import { DeleteProjectDialog } from "./delete-project-dialog";
import {
  ProjectFilters,
  type ProjectFiltersValue,
} from "./project-filters";
import { ProjectMobileList } from "./project-mobile-list";
import { ProjectSummary } from "./project-summary";
import { ProjectTable } from "./project-table";

type ProjectsViewProps = {
  projects: Project[];
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onDelete: (project: Project) => Promise<void>;
};

function positiveOption(value: string | null, options: Array<{ id: number }>) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && options.some((item) => item.id === id)
    ? id
    : null;
}

function ProjectsSkeleton() {
  return (
    <div role="status" aria-label="Loading projects" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="hidden h-10 w-32 sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}

export function ProjectsView({
  projects,
  categories,
  technologies,
  isPending,
  error,
  onRetry,
  onDelete,
}: ProjectsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProjectFiltersValue>(() => ({
    query: searchParams.get("q")?.trim() ?? "",
    categoryId: positiveOption(searchParams.get("category"), categories),
    technologyId: positiveOption(
      searchParams.get("technology"),
      technologies,
    ),
  }));
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    const created = searchParams.get("created") === "1";
    const updated = searchParams.get("updated") === "1";
    if (!created && !updated) {
      return;
    }

    toast.success(
      created ? "Project created successfully" : "Project updated successfully",
    );
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("created");
    nextParams.delete("updated");
    const queryString = nextParams.toString();
    router.replace(queryString ? `/projects?${queryString}` : "/projects", {
      scroll: false,
    });
  }, [router, searchParams]);

  const filteredProjects = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        query === "" ||
        project.title.toLocaleLowerCase().includes(query) ||
        project.description.toLocaleLowerCase().includes(query);
      const matchesCategory =
        filters.categoryId === null ||
        project.category.id === filters.categoryId;
      const matchesTechnology =
        filters.technologyId === null ||
        project.technologies.some(
          (technology) => technology.id === filters.technologyId,
        );
      return matchesQuery && matchesCategory && matchesTechnology;
    });
  }, [filters, projects]);

  function updateFilters(nextFilters: ProjectFiltersValue) {
    setFilters(nextFilters);
    const params = new URLSearchParams();
    const query = nextFilters.query.trim();
    if (query) {
      params.set("q", query);
    }
    if (nextFilters.categoryId) {
      params.set("category", String(nextFilters.categoryId));
    }
    if (nextFilters.technologyId) {
      params.set("technology", String(nextFilters.technologyId));
    }

    const queryString = params.toString();
    router.replace(queryString ? `/projects?${queryString}` : "/projects", {
      scroll: false,
    });
  }

  if (isPending) {
    return <ProjectsSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        title="Projects unavailable"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio content</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage the projects displayed in your public portfolio.
          </p>
        </div>
        <Link
          href="/projects/new"
          className={buttonVariants({ size: "lg" })}
        >
          <Plus data-icon="inline-start" />
          New Project
        </Link>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start presenting your work."
          icon={<FolderPlus className="size-5" aria-hidden="true" />}
          action={
            <Link
              href="/projects/new"
              className={buttonVariants({ size: "lg" })}
            >
              Create your first project
            </Link>
          }
        />
      ) : (
        <>
          <ProjectSummary projects={projects} />
          <ProjectFilters
            value={filters}
            categories={categories}
            technologies={technologies}
            onChange={updateFilters}
          />
          {filteredProjects.length === 0 ? (
            <EmptyState
              title="No matching projects"
              description="Adjust or clear the filters to see more projects."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={() =>
                    updateFilters({
                      query: "",
                      categoryId: null,
                      technologyId: null,
                    })
                  }
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <ProjectTable
                projects={filteredProjects}
                onDelete={setProjectToDelete}
              />
              <ProjectMobileList
                projects={filteredProjects}
                onDelete={setProjectToDelete}
              />
              <p className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
              </p>
            </>
          )}
        </>
      )}

      <DeleteProjectDialog
        project={projectToDelete}
        open={projectToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}
