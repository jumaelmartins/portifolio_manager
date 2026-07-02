import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TechnologyEntry } from "../types";

type TechnologyMobileListProps = {
  entries: TechnologyEntry[];
  canDelete: boolean;
  onDelete: (entry: TechnologyEntry) => void;
};

export function TechnologyMobileList({
  entries,
  canDelete,
  onDelete,
}: TechnologyMobileListProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {entries.map((entry) => (
        <Card key={entry.id} className="bg-card/75">
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-medium">{entry.name}</p>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/technologies/${entry.id}/edit`}
                  aria-label={`Edit ${entry.name}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                >
                  <Pencil />
                </Link>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${entry.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
