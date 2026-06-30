import type {
  BackendImage,
  BackendProject,
  BackendProjectInput,
  ImageOption,
  Project,
  ProjectInput,
} from "../types";

export function rewriteUploadUrl(url: string): string {
  try {
    const uploadPath = new URL(url).pathname.replace(/^\/uploads\//, "");
    return `/api/uploads/file/${uploadPath}`;
  } catch {
    return url;
  }
}

export function normalizeImage(image: BackendImage): ImageOption {
  return {
    id: image.id,
    description: image.description,
    url: rewriteUploadUrl(image.url),
    createdAt: image.created_at,
    updatedAt: image.updated_at,
  };
}

export function normalizeProject(project: BackendProject): Project {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    repositoryUrl: project.repo_url,
    liveUrl: project.live_url,
    category: {
      id: project.category.id,
      name: project.category.category,
    },
    technologies: project.technologies.map((technology) => ({
      id: technology.id,
      name: technology.tech,
    })),
    coverImage: project.f_images ? normalizeImage(project.f_images) : null,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export function toBackendProjectInput(
  input: ProjectInput,
): BackendProjectInput {
  return {
    title: input.title,
    description: input.description,
    d_categoryId: input.categoryId,
    technologyIds: input.technologyIds,
    repo_url: input.repositoryUrl || undefined,
    live_url: input.liveUrl || undefined,
    f_imagesId: input.coverImageId ?? undefined,
  };
}
