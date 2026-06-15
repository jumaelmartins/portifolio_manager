import { format } from "date-fns";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Project } from "../types";

type ProjectTableProps = {
  projects: Project[];
  onDelete: (project: Project) => void;
};

export function ProjectTable({ projects, onDelete }: ProjectTableProps) {
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
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/projects/${project.id}/edit`}
                    aria-label={`Edit ${project.title}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                    )}
                  >
                    <Pencil />
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${project.title}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(project)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
