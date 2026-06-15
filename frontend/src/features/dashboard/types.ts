export type DashboardImage = {
  id: number;
  url: string;
};

export type DashboardCategory = {
  id: number;
  name: string;
};

export type DashboardTechnology = {
  id: number;
  name: string;
};

export type DashboardProject = {
  id: number;
  title: string;
  description?: string | null;
  category?: DashboardCategory | null;
  coverImage: DashboardImage | null;
  updatedAt: string;
};

export type DashboardSource = {
  projects: DashboardProject[];
  categories: DashboardCategory[];
  technologies: DashboardTechnology[];
};

export type DashboardData = {
  metrics: {
    projects: number;
    categories: number;
    technologies: number;
    withCover: number;
    withoutCover: number;
  };
  recentProjects: DashboardProject[];
};
