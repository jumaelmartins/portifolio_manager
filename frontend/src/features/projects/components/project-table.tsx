import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ContentRowActions } from "@/components/ui/content-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContentState } from "@/lib/content-state";
import type { Project } from "../types";

type ProjectTableProps = {
  projects: Project[];
  state: ContentState;
  onArchive: (project: Project) => void;
  onUnarchive: (project: Project) => void;
  onRestore: (project: Project) => void;
  onSoftDelete: (project: Project) => void;
  onPurge: (project: Project) => void;
};

export function ProjectTable({
  projects,
  state,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ProjectTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card/70 md:block">
      <Table>
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="pl-4">Project</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Technologies</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="min-w-72 pl-4">
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted bg-cover bg-center text-muted-foreground ring-1 ring-border"
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
                      <ImageIcon className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.title}</p>
                    <p className="mt-1 max-w-sm truncate text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{project.category.name}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex max-w-72 flex-wrap gap-1">
                  {project.technologies.slice(0, 3).map((technology) => (
                    <Badge key={technology.id} variant="outline">
                      {technology.name}
                    </Badge>
                  ))}
                  {project.technologies.length > 3 ? (
                    <Badge variant="outline">
                      +{project.technologies.length - 3}
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(project.updatedAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="pr-4">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
