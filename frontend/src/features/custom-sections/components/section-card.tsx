// frontend/src/features/custom-sections/components/section-card.tsx
"use client";

import { List } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentRowActions } from "@/components/ui/content-row-actions";
import type { ContentState } from "@/lib/content-state";
import type { CustomSection } from "../types";

type SectionCardProps = {
  section: CustomSection;
  state: ContentState;
  onManageItems: (sectionId: number) => void;
  onArchive: (section: CustomSection) => void;
  onUnarchive: (section: CustomSection) => void;
  onRestore: (section: CustomSection) => void;
  onSoftDelete: (section: CustomSection) => void;
  onPurge: (section: CustomSection) => void;
};

export function SectionCard({
  section,
  state,
  onManageItems,
  onArchive,
  onUnarchive,
  onRestore,
  onSoftDelete,
  onPurge,
}: SectionCardProps) {
  return (
    <Card className="bg-card/75">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {section.icon ? (
              <span className="text-xs text-muted-foreground">{section.icon}</span>
            ) : null}
            {section.name}
          </CardTitle>
          {section.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{section.description}</p>
          ) : null}
        </div>
        <Badge variant="secondary">
          {section.items.length} {section.items.length === 1 ? "item" : "items"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={() => onManageItems(section.id)}>
          <List data-icon="inline-start" />
          Manage items
        </Button>
        <ContentRowActions
          state={state}
          label={section.name}
          editHref={`/custom-sections/${section.id}/edit`}
          onArchive={() => onArchive(section)}
          onUnarchive={() => onUnarchive(section)}
          onRestore={() => onRestore(section)}
          onSoftDelete={() => onSoftDelete(section)}
          onPurge={() => onPurge(section)}
        />
      </CardContent>
    </Card>
  );
}
