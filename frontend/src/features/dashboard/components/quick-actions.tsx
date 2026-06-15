import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActions() {
  return (
    <Card className="bg-card/75">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/projects/new"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 justify-between px-4",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            New Project
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 justify-between bg-muted/20 px-4",
          )}
        >
          View Projects
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
