"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortSelectOption = {
  key: string;
  label: string;
};

type SortSelectProps = {
  value: string;
  options: SortSelectOption[];
  onValueChange: (key: string) => void;
  ariaLabel?: string;
  className?: string;
};

export function SortSelect({
  value,
  options,
  onValueChange,
  ariaLabel = "Sort",
  className,
}: SortSelectProps) {
  return (
    <Select
      items={Object.fromEntries(
        options.map((option) => [option.key, option.label]),
      )}
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(String(next));
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("h-10 w-full bg-card/60 sm:w-48", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
