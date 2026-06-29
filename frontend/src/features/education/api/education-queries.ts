"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { EducationInput } from "../types";
import {
  createEducation,
  deleteEducation,
  getEducation,
  getEducations,
  updateEducation,
} from "./education-api";

export const educationKeys = {
  all: ["education"] as const,
  detail: (id: number) => ["education", id] as const,
};

export function useEducations() {
  return useQuery({
    queryKey: educationKeys.all,
    queryFn: getEducations,
  });
}

export function useEducation(id: number) {
  return useQuery({
    queryKey: educationKeys.detail(id),
    queryFn: () => getEducation(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEducation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: educationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EducationInput }) =>
      updateEducation(id, input),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: educationKeys.all }),
        queryClient.invalidateQueries({
          queryKey: educationKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEducation,
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: educationKeys.all }),
        queryClient.invalidateQueries({ queryKey: educationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
