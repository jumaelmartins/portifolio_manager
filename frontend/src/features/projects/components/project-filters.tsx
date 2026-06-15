import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption, TechnologyOption } from "../types";

export type ProjectFiltersValue = {
  query: string;
  categoryId: number | null;
  technologyId: number | null;
};

type ProjectFiltersProps = {
  value: ProjectFiltersValue;
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  onChange: (value: ProjectFiltersValue) => void;
};

export function ProjectFilters({
  value,
  categories,
  technologies,
  onChange,
}: ProjectFiltersProps) {
  const hasFilters =
    value.query !== "" ||
    value.categoryId !== null ||
    value.technologyId !== null;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={value.query}
          onChange={(event) =>
            onChange({ ...value, query: event.currentTarget.value })
          }
          placeholder="Search projects..."
          className="h-10 bg-card/60 pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          items={Object.fromEntries([
            ["all", "All categories"],
            ...categories.map((category) => [
              category.id.toString(),
              category.name,
            ]),
          ])}
          value={value.categoryId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onChange({
              ...value,
              categoryId:
                nextValue && nextValue !== "all" ? Number(nextValue) : null,
            })
          }
        >
          <SelectTrigger
            aria-label="Category"
            className="h-10 w-full bg-card/60 sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={Object.fromEntries([
            ["all", "All technologies"],
            ...technologies.map((technology) => [
              technology.id.toString(),
              technology.name,
            ]),
          ])}
          value={value.technologyId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onChange({
              ...value,
              technologyId:
                nextValue && nextValue !== "all" ? Number(nextValue) : null,
            })
          }
        >
          <SelectTrigger
            aria-label="Technology"
            className="h-10 w-full bg-card/60 sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All technologies</SelectItem>
            {technologies.map((technology) => (
              <SelectItem key={technology.id} value={technology.id.toString()}>
                {technology.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="h-10 justify-center lg:justify-start"
          onClick={() =>
            onChange({ query: "", categoryId: null, technologyId: null })
          }
        >
          <X data-icon="inline-start" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
