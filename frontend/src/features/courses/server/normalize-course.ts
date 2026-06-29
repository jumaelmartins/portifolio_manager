import type {
  BackendCourse,
  BackendCourseInput,
  CourseEntry,
  CourseInput,
} from "../types";

export function normalizeCourse(c: BackendCourse): CourseEntry {
  return {
    id: c.id,
    title: c.title,
    institutionName: c.institution_name,
    description: c.description,
    startDate: c.start_date.slice(0, 10),
    endDate: c.end_date ? c.end_date.slice(0, 10) : null,
    current: c.current,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export function toBackendCourseInput(input: CourseInput): BackendCourseInput {
  return {
    title: input.title,
    institution_name: input.institutionName,
    description: input.description || undefined,
    start_date: input.startDate,
    end_date: !input.current && input.endDate ? input.endDate : undefined,
    current: input.current,
  };
}
