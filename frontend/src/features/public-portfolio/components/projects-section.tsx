import Image from "next/image";

import { Badge } from "@/components/ui/badge";

import type { PublicProject } from "../types";
import { SectionShell } from "./section-shell";

export function ProjectsSection({ projects }: { projects: PublicProject[] }) {
  if (projects.length === 0) return null;
  return (
    <SectionShell id="projects" title="Projects">
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="flex flex-col gap-3 rounded-lg border p-5">
            {project.coverUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                <Image
                  src={project.coverUrl}
                  alt={project.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            ) : null}
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            {project.category || project.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.category ? <Badge variant="secondary">{project.category}</Badge> : null}
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            ) : null}
            {project.repositoryUrl || project.liveUrl ? (
              <div className="mt-auto flex gap-4 text-sm">
                {project.repositoryUrl ? (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Repository
                  </a>
                ) : null}
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Live
                  </a>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
