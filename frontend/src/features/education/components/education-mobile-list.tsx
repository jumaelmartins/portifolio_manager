import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ContentRowActions } from "@/components/ui/content-row-actions";
import type { ContentState } from "@/lib/content-state";
import type { EducationEntry } from "../types";

type EducationMobileListProps = {
  entries: EducationEntry[];
  state: ContentState;
  onArchive: (entry: EducationEntry) => void;
  onUnarchive: (entry: EducationEntry) => void;
  onRestore: (entry: EducationEntry) => void;
  onSoftDelete: (entry: EducationEntry) => void;
  onPurge: (entry: EducationEntry) => void;
};

export function EducationMobileList({
  entries,
  state,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: EducationMobileListProps) {
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
              <div className="shrink-0">
                <ContentRowActions
                  state={state}
                  label={entry.title}
                  editHref={`/education/${entry.id}/edit`}
                  onArchive={() => onArchive(entry)}
                  onUnarchive={() => onUnarchive(entry)}
                  onRestore={() => onRestore(entry)}
                  onSoftDelete={() => onSoftDelete(entry)}
                  onPurge={() => onPurge(entry)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
