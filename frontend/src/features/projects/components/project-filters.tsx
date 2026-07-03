import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryOption, TechnologyOption } from "../types";

type ProjectFiltersProps = {
  categoryId: number | null;
  technologyId: number | null;
  categories: CategoryOption[];
  technologies: TechnologyOption[];
  onCategoryChange: (id: number | null) => void;
  onTechnologyChange: (id: number | null) => void;
  onClear: () => void;
  showClear: boolean;
};

export function ProjectFilters({
  categoryId,
  technologyId,
  categories,
  technologies,
  onCategoryChange,
  onTechnologyChange,
  onClear,
  showClear,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          items={Object.fromEntries([
            ["all", "All categories"],
            ...categories.map((category) => [
              category.id.toString(),
              category.name,
            ]),
          ])}
          value={categoryId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onCategoryChange(
              nextValue && nextValue !== "all" ? Number(nextValue) : null,
            )
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
          value={technologyId?.toString() ?? "all"}
          onValueChange={(nextValue) =>
            onTechnologyChange(
              nextValue && nextValue !== "all" ? Number(nextValue) : null,
            )
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
      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          className="h-10 justify-center sm:justify-start"
          onClick={onClear}
        >
          <X data-icon="inline-start" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
