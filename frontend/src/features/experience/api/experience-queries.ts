"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ExperienceInput } from "../types";
import {
  createExperience,
  deleteExperience,
  getExperience,
  getExperiences,
  updateExperience,
} from "./experience-api";

export const experienceKeys = {
  all: ["experience"] as const,
  detail: (id: number) => ["experience", id] as const,
};

export function useExperiences() {
  return useQuery({
    queryKey: experienceKeys.all,
    queryFn: getExperiences,
  });
}

export function useExperience(id: number) {
  return useQuery({
    queryKey: experienceKeys.detail(id),
    queryFn: () => getExperience(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExperience,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExperienceInput }) =>
      updateExperience(id, input),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({
          queryKey: experienceKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExperience,
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({ queryKey: experienceKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
