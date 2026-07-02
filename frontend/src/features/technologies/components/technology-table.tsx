import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

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
import type { TechnologyEntry } from "../types";

type TechnologyTableProps = {
  entries: TechnologyEntry[];
  canDelete: boolean;
  onDelete: (entry: TechnologyEntry) => void;
};

export function TechnologyTable({
  entries,
  canDelete,
  onDelete,
}: TechnologyTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card/70 md:block">
      <Table>
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="pl-4">Name</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="pl-4 font-medium">{entry.name}</TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
