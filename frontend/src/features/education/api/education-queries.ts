"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ContentState } from "@/lib/content-state";
import { reorderByIds } from "@/lib/reorder/reorder-by-ids";
import { useReorder } from "@/lib/reorder/use-reorder";
import type { EducationEntry, EducationInput } from "../types";
import {
  archiveEducation,
  createEducation,
  deleteEducation,
  getEducation,
  getEducations,
  purgeEducation,
  reorderEducations,
  restoreEducation,
  unarchiveEducation,
  updateEducation,
} from "./education-api";

export const educationKeys = {
  all: ["education"] as const,
  detail: (id: number) => ["education", id] as const,
};

export function useEducations(state: ContentState = "active") {
  return useQuery({
    queryKey: [...educationKeys.all, state],
    queryFn: () => getEducations(state),
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

export function useReorderEducations() {
  return useReorder<EducationEntry[]>({
    queryKey: [...educationKeys.all, "active"],
    mutationFn: reorderEducations,
    applyOptimistic: (items, ids) => reorderByIds(items, ids),
  });
}

function useEducationTransition(
  mutationFn: (id: number) => Promise<{ id: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: educationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useArchiveEducation() {
  return useEducationTransition(archiveEducation);
}
export function useUnarchiveEducation() {
  return useEducationTransition(unarchiveEducation);
}
export function useRestoreEducation() {
  return useEducationTransition(restoreEducation);
}
export function usePurgeEducation() {
  return useEducationTransition(purgeEducation);
}
