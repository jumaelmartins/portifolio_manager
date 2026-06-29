import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
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
import type { EducationEntry } from "../types";

type EducationTableProps = {
  entries: EducationEntry[];
  onDelete: (entry: EducationEntry) => void;
};

function formatPeriod(entry: EducationEntry) {
  const start = format(new Date(entry.startDate), "MMM yyyy");
  if (entry.current) return `${start} – Present`;
  if (entry.endDate) return `${start} – ${format(new Date(entry.endDate), "MMM yyyy")}`;
  return start;
}

export function EducationTable({ entries, onDelete }: EducationTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card/70 md:block">
      <Table>
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="pl-4">Degree</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="min-w-48 pl-4 font-medium">{entry.title}</TableCell>
              <TableCell className="text-muted-foreground">{entry.institutionName}</TableCell>
              <TableCell>
                {entry.current ? (
                  <Badge variant="secondary">Present</Badge>
                ) : null}
                <span className="text-sm text-muted-foreground ml-1">{formatPeriod(entry)}</span>
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/education/${entry.id}/edit`}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
