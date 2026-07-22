"use client";

import { cn } from "@/lib/utils";
import type { ContentState } from "@/lib/content-state";

const TABS: { value: ContentState; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "trash", label: "Trash" },
];

type StateFilterProps = {
  value: ContentState;
  onChange: (value: ContentState) => void;
};

export function StateFilter({ value, onChange }: StateFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Content state"
      className="inline-flex rounded-lg border border-border bg-card/60 p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
