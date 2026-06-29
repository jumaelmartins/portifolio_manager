import type {
  BackendExperience,
  BackendExperienceInput,
  ExperienceEntry,
  ExperienceInput,
} from "../types";

export function normalizeExperience(e: BackendExperience): ExperienceEntry {
  return {
    id: e.id,
    title: e.tile,
    companyName: e.company_name,
    description: e.description,
    startDate: e.start_date.slice(0, 10),
    endDate: e.end_date ? e.end_date.slice(0, 10) : null,
    current: e.current,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

export function toBackendExperienceInput(
  input: ExperienceInput,
): BackendExperienceInput {
  return {
    tile: input.title,
    company_name: input.companyName,
    description: input.description,
    start_date: input.startDate,
    end_date: !input.current && input.endDate ? input.endDate : undefined,
    current: input.current,
  };
}
