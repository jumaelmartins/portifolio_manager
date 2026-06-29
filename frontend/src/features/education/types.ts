export type EducationEntry = {
  id: number;
  title: string;
  institutionName: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EducationInput = {
  title: string;
  institutionName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
};

export type BackendEducation = {
  id: number;
  title: string;
  institution_name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  current: boolean;
  created_at: string;
  updated_at: string;
};

export type BackendEducationInput = {
  title: string;
  institution_name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
};
