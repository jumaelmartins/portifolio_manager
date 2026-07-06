"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { SortSelect } from "@/components/ui/sort-select";
import { SortableList } from "@/components/ui/sortable-list";
import { useListControls } from "@/lib/list-controls/use-list-controls";
import type { SortOption } from "@/lib/list-controls/types";
import { cn } from "@/lib/utils";
import type { CategoryOption, Project, TechnologyOption } from "../types";
import { useReorderProjects } from "../api/project-queries";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectFilters } from "./project-filters";
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

const PROJECT_SORTS: SortOption<Project>[] = [
  { key: "recent", label: "Recent", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  { key: "oldest", label: "Oldest", compare: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  { key: "title-asc", label: "Title A–Z", compare: (a, b) => a.title.localeCompare(b.title) },
  { key: "title-desc", label: "Title Z–A", compare: (a, b) => b.title.localeCompare(a.title) },
  { key: "order", label: "Manual order", compare: (a, b) => a.order - b.order },
];

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
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const controls = useListControls<Project>({
    items: projects,
    basePath: "/projects",
    searchAccessor: (project) => `${project.title} ${project.description}`,
    sorts: PROJECT_SORTS,
    extraParamKeys: ["category", "technology"],
    predicate: (project, { getParam }) => {
      const categoryId = positiveOption(getParam("category"), categories);
      const technologyId = positiveOption(getParam("technology"), technologies);
      const matchesCategory =
        categoryId === null || project.category.id === categoryId;
      const matchesTechnology =
        technologyId === null ||
        project.technologies.some((technology) => technology.id === technologyId);
      return matchesCategory && matchesTechnology;
    },
  });
  const reorder = useReorderProjects();
  const isManual = controls.sortKey === "order";

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

  const selectedCategory = positiveOption(controls.getParam("category"), categories);
  const selectedTechnology = positiveOption(
    controls.getParam("technology"),
    technologies,
  );
  const hasActiveFilters =
    controls.query !== "" ||
    selectedCategory !== null ||
    selectedTechnology !== null;

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
        <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
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
            <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
              Create your first project
            </Link>
          }
        />
      ) : (
        <>
          <ProjectSummary projects={projects} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {!isManual && (
              <SearchInput
                value={controls.query}
                onChange={controls.setQuery}
                placeholder="Search projects..."
              />
            )}
            <SortSelect
              value={controls.sortKey}
              options={PROJECT_SORTS}
              onValueChange={controls.setSortKey}
            />
            {!isManual && (
              <ProjectFilters
                categoryId={selectedCategory}
                technologyId={selectedTechnology}
                categories={categories}
                technologies={technologies}
                onCategoryChange={(id) =>
                  controls.setParam("category", id === null ? null : String(id))
                }
                onTechnologyChange={(id) =>
                  controls.setParam("technology", id === null ? null : String(id))
                }
                onClear={controls.reset}
                showClear={hasActiveFilters}
              />
            )}
          </div>
          {isManual ? (
            <SortableList
              items={controls.sortedItems}
              onReorder={(ids) => reorder.mutate(ids)}
              getLabel={(project) => project.title}
            >
              {(project) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {project.category.name}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    aria-label={`Edit ${project.title}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                  >
                    <Pencil />
                  </Link>
                </div>
              )}
            </SortableList>
          ) : controls.totalFiltered === 0 ? (
            <EmptyState
              title="No matching projects"
              description="Adjust or clear the filters to see more projects."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                  onClick={controls.reset}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <ProjectTable
                projects={controls.pageItems}
                onDelete={setProjectToDelete}
              />
              <ProjectMobileList
                projects={controls.pageItems}
                onDelete={setProjectToDelete}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {controls.rangeStart}–{controls.rangeEnd} of{" "}
                  {controls.totalFiltered}
                </p>
                <Pagination
                  page={controls.page}
                  pageCount={controls.pageCount}
                  onPageChange={controls.goToPage}
                />
              </div>
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
