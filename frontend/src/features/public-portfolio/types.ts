import type { FieldSchema } from "@/features/custom-sections/types";

export type { FieldSchema };

export type BackendPublicImage = { id: number; src_path: string };

export type BackendPublicProject = {
  id: number;
  title: string;
  description: string;
  repo_url: string | null;
  live_url: string | null;
  category: { id: number; category: string } | null;
  technologies: { id: number; tech: string }[];
  f_images: BackendPublicImage | null;
  created_at: string;
  updated_at: string;
};

export type BackendPublicExperience = {
  id: number;
  tile: string; // backend typo for "title"
  company_name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendPublicEducation = {
  id: number;
  title: string;
  institution_name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendPublicCourse = {
  id: number;
  title: string;
  institution_name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type BackendPublicCustomItem = {
  id: number;
  data: Record<string, string>;
  order: number | null;
};

export type BackendPublicCustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  field_schema: FieldSchema[];
  order: number | null;
  items: BackendPublicCustomItem[];
};

export type BackendPublicUser = {
  id: number;
  username: string | null;
  role: { id: number; role: string };
  status: { id: number; status: string };
  f_profile_picture: { id: number; f_images: BackendPublicImage } | null;
  f_projects: BackendPublicProject[];
  f_education: BackendPublicEducation[];
  f_courses: BackendPublicCourse[];
  f_experience: BackendPublicExperience[];
  custom_sections: BackendPublicCustomSection[];
  created_at: string;
  updated_at: string;
};

export type PublicProject = {
  id: number;
  title: string;
  description: string;
  repositoryUrl: string | null;
  liveUrl: string | null;
  category: string | null;
  technologies: string[];
  coverUrl: string | null;
};

export type PublicExperience = {
  id: number;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
};

export type PublicEducation = {
  id: number;
  title: string;
  institution: string;
  description: string;
  startDate: string;
  endDate: string | null;
};

export type PublicCourse = {
  id: number;
  title: string;
  institution: string;
  description: string;
  startDate: string;
  endDate: string | null;
};

export type PublicCustomSection = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  fields: FieldSchema[];
  items: { id: number; data: Record<string, string> }[];
};

export type PublicPortfolio = {
  id: number;
  username: string | null;
  role: string;
  avatarUrl: string | null;
  projects: PublicProject[];
  experience: PublicExperience[];
  education: PublicEducation[];
  courses: PublicCourse[];
  customSections: PublicCustomSection[];
};
