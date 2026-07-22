import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ContentRowActions } from "@/components/ui/content-row-actions";
import type { ContentState } from "@/lib/content-state";
import type { Project } from "../types";

type ProjectMobileListProps = {
  projects: Project[];
  state: ContentState;
  onArchive: (project: Project) => void;
  onUnarchive: (project: Project) => void;
  onRestore: (project: Project) => void;
  onSoftDelete: (project: Project) => void;
  onPurge: (project: Project) => void;
};

export function ProjectMobileList({
  projects,
  state,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ProjectMobileListProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {projects.map((project) => (
        <Card key={project.id} className="bg-card/75">
          <CardContent>
            <div className="flex gap-3">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted bg-cover bg-center text-muted-foreground ring-1 ring-border"
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
                <h2 className="truncate font-medium">{project.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{project.category.name}</Badge>
              {project.technologies.map((technology) => (
                <Badge key={technology.id} variant="outline">
                  {technology.name}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">
                Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}
              </span>
              <ContentRowActions
                state={state}
                label={project.title}
                editHref={`/projects/${project.id}/edit`}
                onArchive={() => onArchive(project)}
                onUnarchive={() => onUnarchive(project)}
                onRestore={() => onRestore(project)}
                onSoftDelete={() => onSoftDelete(project)}
                onPurge={() => onPurge(project)}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
