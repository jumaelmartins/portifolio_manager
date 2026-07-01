import { format } from "date-fns";

import type {
  BackendPublicCustomSection,
  BackendPublicProject,
  BackendPublicUser,
  PublicCustomSection,
  PublicPortfolio,
  PublicProject,
} from "../types";

export function publicUploadUrl(srcPath: string): string {
  return `/api/uploads/file/${srcPath.replace(/^\/?uploads\//, "")}`;
}

function safeMonthYear(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "MMM yyyy");
}

export function formatDateRange(start: string, end: string | null): string {
  const startLabel = safeMonthYear(start);
  if (!startLabel) return "";
  if (!end) return `${startLabel} – Present`;
  const endLabel = safeMonthYear(end);
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy");
}

function normalizeProject(p: BackendPublicProject): PublicProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    repositoryUrl: p.repo_url,
    liveUrl: p.live_url,
    category: p.category ? p.category.category : null,
    technologies: p.technologies.map((t) => t.tech),
    coverUrl: p.f_images ? publicUploadUrl(p.f_images.src_path) : null,
  };
}

function normalizeCustomSection(s: BackendPublicCustomSection): PublicCustomSection {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    fields: s.field_schema,
    items: s.items.map((i) => ({ id: i.id, data: i.data })),
  };
}

export function normalizePortfolio(raw: BackendPublicUser): PublicPortfolio {
  return {
    id: raw.id,
    username: raw.username,
    role: raw.role.role,
    avatarUrl: raw.f_profile_picture
      ? publicUploadUrl(raw.f_profile_picture.f_images.src_path)
      : null,
    projects: [...raw.f_projects]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(normalizeProject),
    experience: raw.f_experience.map((e) => ({
      id: e.id,
      title: e.tile,
      company: e.company_name,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
    })),
    education: raw.f_education.map((e) => ({
      id: e.id,
      title: e.title,
      institution: e.institution_name,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
    })),
    courses: raw.f_courses.map((c) => ({
      id: c.id,
      title: c.title,
      institution: c.institution_name,
      description: c.description,
      startDate: c.start_date,
      endDate: c.end_date,
    })),
    customSections: raw.custom_sections.map(normalizeCustomSection),
  };
}
