import type {
  BackendEducation,
  BackendEducationInput,
  EducationEntry,
  EducationInput,
} from "../types";

export function normalizeEducation(e: BackendEducation): EducationEntry {
  return {
    id: e.id,
    title: e.title,
    institutionName: e.institution_name,
    description: e.description,
    startDate: e.start_date.slice(0, 10),
    endDate: e.end_date ? e.end_date.slice(0, 10) : null,
    current: e.current,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

export function toBackendEducationInput(
  input: EducationInput,
): BackendEducationInput {
  return {
    title: input.title,
    institution_name: input.institutionName,
    description: input.description || undefined,
    start_date: input.startDate,
    end_date: !input.current && input.endDate ? input.endDate : undefined,
    current: input.current,
  };
}
