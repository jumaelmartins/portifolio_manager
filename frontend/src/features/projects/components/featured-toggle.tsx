"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetProjectFeatured } from "../api/project-queries";
import type { Project } from "../types";

type FeaturedToggleProps = {
  project: Project;
};

export function FeaturedToggle({ project }: FeaturedToggleProps) {
  const mutation = useSetProjectFeatured();
  const { featured } = project;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={featured}
      aria-label={
        featured
          ? `Unfeature ${project.title}`
          : `Feature ${project.title}`
      }
      title={featured ? "Featured — click to unfeature" : "Mark as featured"}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { id: project.id, featured: !featured },
          {
            onError: () =>
              toast.error("Could not update the featured status."),
          },
        )
      }
    >
      <Star
        className={cn(
          featured ? "fill-current text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}
