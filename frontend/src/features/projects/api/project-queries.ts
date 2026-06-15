"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ProjectInput } from "../types";
import {
  createProject,
  deleteProject,
  getCategories,
  getImages,
  getProject,
  getProjects,
  getTechnologies,
  updateProject,
  uploadImage,
} from "./project-api";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: number) => ["projects", id] as const,
  categories: ["categories"] as const,
  technologies: ["technologies"] as const,
  images: ["images"] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: getProjects,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: projectKeys.categories,
    queryFn: getCategories,
  });
}

export function useTechnologies() {
  return useQuery({
    queryKey: projectKeys.technologies,
    queryFn: getTechnologies,
  });
}

export function useImages() {
  return useQuery({
    queryKey: projectKeys.images,
    queryFn: getImages,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProjectInput }) =>
      updateProject(id, input),
    onSuccess: async (_project, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadImage,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.images }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
