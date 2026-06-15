import { NextResponse } from "next/server";

import { buildDashboard } from "@/features/dashboard/server/build-dashboard";
import type {
  DashboardCategory,
  DashboardImage,
  DashboardProject,
  DashboardTechnology,
} from "@/features/dashboard/types";
import { backendFetch } from "@/lib/api/backend";
import { toBffResponse } from "@/lib/api/bff";

type BackendCategory = {
  id: number;
  category: string;
};

type BackendTechnology = {
  id: number;
  tech: string;
};

type BackendImage = {
  id: number;
  url: string;
};

type BackendProject = {
  id: number;
  title: string;
  description?: string | null;
  category?: BackendCategory | null;
  f_images?: BackendImage | null;
  updated_at: string;
};

function normalizeCategory(category: BackendCategory): DashboardCategory {
  return { id: category.id, name: category.category };
}

function normalizeTechnology(
  technology: BackendTechnology,
): DashboardTechnology {
  return { id: technology.id, name: technology.tech };
}

function normalizeImage(
  image: BackendImage | null | undefined,
): DashboardImage | null {
  return image ? { id: image.id, url: image.url } : null;
}

function normalizeProject(project: BackendProject): DashboardProject {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category ? normalizeCategory(project.category) : null,
    coverImage: normalizeImage(project.f_images),
    updatedAt: project.updated_at,
  };
}

export async function GET() {
  const [projectsResponse, categoriesResponse, technologiesResponse] =
    await Promise.all([
      backendFetch("/projects"),
      backendFetch("/category"),
      backendFetch("/technologies"),
    ]);
  const failedResponse = [
    projectsResponse,
    categoriesResponse,
    technologiesResponse,
  ].find((response) => !response.ok);

  if (failedResponse) {
    return toBffResponse(failedResponse);
  }

  const [projects, categories, technologies] = (await Promise.all([
    projectsResponse.json(),
    categoriesResponse.json(),
    technologiesResponse.json(),
  ])) as [BackendProject[], BackendCategory[], BackendTechnology[]];

  return NextResponse.json(
    buildDashboard({
      projects: projects.map(normalizeProject),
      categories: categories.map(normalizeCategory),
      technologies: technologies.map(normalizeTechnology),
    }),
  );
}
