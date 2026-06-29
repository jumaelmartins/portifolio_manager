import { format } from "date-fns";
import { ArrowRight, ImageIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { DashboardProject } from "../types";

export function RecentProjects({
  projects,
}: {
  projects: DashboardProject[];
}) {
  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Recent projects</CardTitle>
        <CardDescription>Latest changes across your portfolio.</CardDescription>
        {projects.length > 0 ? (
          <CardAction>
            <Link
              href="/projects"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View all
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start building the portfolio overview."
            action={
              <Link
                href="/projects/new"
                className={buttonVariants({ size: "lg" })}
              >
                Create your first project
                <ArrowRight data-icon="inline-end" />
              </Link>
            }
            className="min-h-72"
          />
        ) : (
          <div className="divide-y divide-border">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/edit`}
                className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted bg-cover bg-center text-muted-foreground ring-1 ring-border"
                  style={
                    project.coverImage
                      ? {
                          backgroundImage: `url("${project.coverImage.url}")`,
                        }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  {project.coverImage ? null : (
                    <ImageIcon className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium transition-colors group-hover:text-primary">
                    {project.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {project.description || "No description provided."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {project.category ? (
                      <Badge variant="secondary">
                        {project.category.name}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
