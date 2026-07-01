// frontend/src/features/custom-sections/components/section-card.tsx
"use client";

import { List, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomSection } from "../types";

type SectionCardProps = {
  section: CustomSection;
  onManageItems: (sectionId: number) => void;
  onDelete: (section: CustomSection) => void;
};

export function SectionCard({ section, onManageItems, onDelete }: SectionCardProps) {
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
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => onManageItems(section.id)}>
          <List data-icon="inline-start" />
          Manage items
        </Button>
        <Link
          href={`/custom-sections/${section.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil data-icon="inline-start" />
          Edit
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          aria-label={`Delete ${section.name}`}
          onClick={() => onDelete(section)}
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </CardContent>
    </Card>
  );
}
