"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ContentState } from "@/lib/content-state";
import { reorderByIds } from "@/lib/reorder/reorder-by-ids";
import { useReorder } from "@/lib/reorder/use-reorder";
import type { ExperienceEntry, ExperienceInput } from "../types";
import {
  archiveExperience,
  createExperience,
  deleteExperience,
  getExperience,
  getExperiences,
  purgeExperience,
  reorderExperiences,
  restoreExperience,
  unarchiveExperience,
  updateExperience,
} from "./experience-api";

export const experienceKeys = {
  all: ["experience"] as const,
  detail: (id: number) => ["experience", id] as const,
};

export function useExperiences(state: ContentState = "active") {
  return useQuery({
    queryKey: [...experienceKeys.all, state],
    queryFn: () => getExperiences(state),
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

export function useReorderExperiences() {
  return useReorder<ExperienceEntry[]>({
    queryKey: [...experienceKeys.all, "active"],
    mutationFn: reorderExperiences,
    applyOptimistic: (items, ids) => reorderByIds(items, ids),
  });
}

function useExperienceTransition(
  mutationFn: (id: number) => Promise<{ id: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: experienceKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useArchiveExperience() {
  return useExperienceTransition(archiveExperience);
}
export function useUnarchiveExperience() {
  return useExperienceTransition(unarchiveExperience);
}
export function useRestoreExperience() {
  return useExperienceTransition(restoreExperience);
}
export function usePurgeExperience() {
  return useExperienceTransition(purgeExperience);
}
