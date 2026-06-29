export type ExperienceEntry = {
  id: number;
  title: string;
  companyName: string;
  description: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceInput = {
  title: string;
  companyName: string;
  description: string;
  startDate: string;
  endDate?: string;
  current: boolean;
};

export type BackendExperience = {
  id: number;
  tile: string;
  company_name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  created_at: string;
  updated_at: string;
};

export type BackendExperienceInput = {
  tile: string;
  company_name: string;
  description: string;
  start_date: string;
  end_date?: string;
  current: boolean;
};
