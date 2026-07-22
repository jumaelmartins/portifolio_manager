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
import type { ExperienceEntry } from "../types";

type ExperienceTableProps = {
  entries: ExperienceEntry[];
  state: ContentState;
  onArchive: (entry: ExperienceEntry) => void;
  onUnarchive: (entry: ExperienceEntry) => void;
  onRestore: (entry: ExperienceEntry) => void;
  onSoftDelete: (entry: ExperienceEntry) => void;
  onPurge: (entry: ExperienceEntry) => void;
};

function formatPeriod(entry: ExperienceEntry) {
  const start = format(new Date(entry.startDate), "MMM yyyy");
  if (entry.current) return `${start} – Present`;
  if (entry.endDate) return `${start} – ${format(new Date(entry.endDate), "MMM yyyy")}`;
  return start;
}

export function ExperienceTable({
  entries,
  state,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: ExperienceTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card/70 md:block">
      <Table>
        <TableHeader className="bg-muted/35">
          <TableRow>
            <TableHead className="pl-4">Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="min-w-48 pl-4 font-medium">{entry.title}</TableCell>
              <TableCell className="text-muted-foreground">{entry.companyName}</TableCell>
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
                  editHref={`/experience/${entry.id}/edit`}
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
