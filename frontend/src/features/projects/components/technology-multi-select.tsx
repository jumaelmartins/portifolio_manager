"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TechnologyOption } from "../types";

type TechnologyMultiSelectProps = {
  technologies: TechnologyOption[];
  value: number[];
  onChange: (value: number[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TechnologyMultiSelect({
  technologies,
  value,
  onChange,
  open,
  onOpenChange,
}: TechnologyMultiSelectProps) {
  function toggle(id: number) {
    onChange(
      value.includes(id)
        ? value.filter((technologyId) => technologyId !== id)
        : [...value, id],
    );
  }

  const selected = technologies.filter((technology) =>
    value.includes(technology.id),
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-label="Technologies"
              aria-expanded={open}
              className="h-10 w-full justify-between bg-background font-normal"
            />
          }
        >
          {selected.length
            ? `${selected.length} selected`
            : "Choose technologies"}
          <ChevronsUpDown className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--anchor-width] p-0">
          <Command>
            <CommandInput placeholder="Search technologies..." />
            <CommandList>
              <CommandEmpty>No technology found.</CommandEmpty>
              <CommandGroup>
                {technologies.map((technology) => {
                  const checked = value.includes(technology.id);
                  return (
                    <CommandItem
                      key={technology.id}
                      value={technology.name}
                      role="option"
                      aria-selected={checked}
                      data-checked={checked}
                      onSelect={() => toggle(technology.id)}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          checked ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {technology.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((technology) => (
            <Badge key={technology.id} variant="secondary" className="gap-1">
              {technology.name}
              <button
                type="button"
                aria-label={`Remove ${technology.name}`}
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => toggle(technology.id)}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  );
}
