import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CourseEntry } from "../types";

type CourseMobileListProps = {
  entries: CourseEntry[];
  onDelete: (entry: CourseEntry) => void;
};

export function CourseMobileList({ entries, onDelete }: CourseMobileListProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {entries.map((entry) => (
        <Card key={entry.id} className="bg-card/75">
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{entry.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{entry.institutionName}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {entry.current ? <Badge variant="secondary">Present</Badge> : null}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.startDate), "MMM yyyy")}
                    {entry.current ? "" : entry.endDate ? ` – ${format(new Date(entry.endDate), "MMM yyyy")}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/courses/${entry.id}/edit`}
                  aria-label={`Edit ${entry.title}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                >
                  <Pencil />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${entry.title}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
