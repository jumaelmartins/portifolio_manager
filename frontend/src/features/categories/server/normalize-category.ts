import type {
  BackendCategory,
  BackendCategoryInput,
  CategoryEntry,
  CategoryInput,
} from "../types";

export function normalizeCategory(c: BackendCategory): CategoryEntry {
  return {
    id: c.id,
    name: c.category,
  };
}

export function toBackendCategoryInput(
  input: CategoryInput,
): BackendCategoryInput {
  return {
    category: input.name,
  };
}
