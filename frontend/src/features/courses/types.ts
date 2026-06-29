export type CourseEntry = {
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

export type CourseInput = {
  title: string;
  institutionName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
};

export type BackendCourse = {
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

export type BackendCourseInput = {
  title: string;
  institution_name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
};
