import { format } from "date-fns";

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
import type { CourseEntry } from "../types";

type CourseTableProps = {
  entries: CourseEntry[];
  state: ContentState;
  onArchive: (entry: CourseEntry) => void;
  onUnarchive: (entry: CourseEntry) => void;
  onRestore: (entry: CourseEntry) => void;
  onSoftDelete: (entry: CourseEntry) => void;
  onPurge: (entry: CourseEntry) => void;
};

function formatPeriod(entry: CourseEntry) {
  const start = format(new Date(entry.startDate), "MMM yyyy");
  if (entry.current) return `${start} – Present`;
  if (entry.endDate) return `${start} – ${format(new Date(entry.endDate), "MMM yyyy")}`;
  return start;
}

export function CourseTable({
  entries,
  state,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: CourseTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card/70 md:block">
      <Table>
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="pl-4">Course</TableHead>
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
                <ContentRowActions
                  state={state}
                  label={entry.title}
                  editHref={`/courses/${entry.id}/edit`}
                  onArchive={() => onArchive(entry)}
                  onUnarchive={() => onUnarchive(entry)}
                  onRestore={() => onRestore(entry)}
                  onSoftDelete={() => onSoftDelete(entry)}
                  onPurge={() => onPurge(entry)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
