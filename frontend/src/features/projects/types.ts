export type CategoryOption = {
  id: number;
  name: string;
};

export type TechnologyOption = {
  id: number;
  name: string;
};

export type ImageOption = {
  id: number;
  description: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  repositoryUrl: string | null;
  liveUrl: string | null;
  category: CategoryOption;
  technologies: TechnologyOption[];
  coverImage: ImageOption | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  title: string;
  description: string;
  categoryId: number;
  technologyIds: number[];
  repositoryUrl?: string;
  liveUrl?: string;
  coverImageId: number | null;
};

export type BackendImage = {
  id: number;
  description: string | null;
  url: string;
  created_at: string;
  updated_at: string;
};

export type BackendProject = {
  id: number;
  title: string;
  description: string;
  repo_url: string | null;
  live_url: string | null;
  d_categoryId: number;
  f_imagesId: number | null;
  category: {
    id: number;
    category: string;
  };
  technologies: Array<{
    id: number;
    tech: string;
  }>;
  f_images: BackendImage | null;
  created_at: string;
  updated_at: string;
};

export type BackendProjectInput = {
  title: string;
  description: string;
  d_categoryId: number;
  technologyIds: number[];
  repo_url: string | undefined;
  live_url: string | undefined;
  f_imagesId: number | undefined;
};
