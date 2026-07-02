import type {
  BackendTechnology,
  BackendTechnologyInput,
  TechnologyEntry,
  TechnologyInput,
} from "../types";

export function normalizeTechnology(t: BackendTechnology): TechnologyEntry {
  return {
    id: t.id,
    name: t.tech,
  };
}

export function toBackendTechnologyInput(
  input: TechnologyInput,
): BackendTechnologyInput {
  return {
    tech: input.name,
  };
}
