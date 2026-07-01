import type {
  BackendCustomItem,
  BackendCustomSection,
  BackendCustomSectionInput,
  CustomItem,
  CustomItemInput,
  CustomSection,
  CustomSectionInput,
} from "../types";

export function normalizeSection(s: BackendCustomSection): CustomSection {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    fieldSchema: Array.isArray(s.field_schema) ? s.field_schema : [],
    order: s.order,
    items: (s.items ?? []).map(normalizeItem),
  };
}

export function normalizeItem(i: BackendCustomItem): CustomItem {
  return {
    id: i.id,
    sectionId: i.section_id,
    data: (i.data ?? {}) as Record<string, string>,
    order: i.order,
  };
}

export function toBackendSectionInput(input: CustomSectionInput): BackendCustomSectionInput {
  return {
    name: input.name,
    field_schema: input.fieldSchema,
    description: input.description || undefined,
    icon: input.icon || undefined,
  };
}

export function toBackendItemInput(input: CustomItemInput): { data: Record<string, string> } {
  return { data: input.data };
}
