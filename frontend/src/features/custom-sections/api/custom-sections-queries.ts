"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ContentState } from "@/lib/content-state";
import { reorderByIds } from "@/lib/reorder/reorder-by-ids";
import { useReorder } from "@/lib/reorder/use-reorder";
import type { CustomItemInput, CustomSection, CustomSectionInput } from "../types";
import {
  archiveSection,
  createItem,
  createSection,
  deleteItem,
  deleteSection,
  fetchSections,
  purgeSection,
  reorderItems,
  reorderSections,
  restoreSection,
  unarchiveSection,
  updateItem,
  updateSection,
} from "./custom-sections-api";

export const customSectionKeys = {
  all: ["custom-sections"] as const,
};

export function useSections(state: ContentState = "active") {
  return useQuery({
    queryKey: [...customSectionKeys.all, state],
    queryFn: () => fetchSections(state),
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomSectionInput }) =>
      updateSection(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, input }: { sectionId: number; input: CustomItemInput }) =>
      createItem(sectionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: number; input: CustomItemInput }) =>
      updateItem(itemId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customSectionKeys.all });
    },
  });
}

export function useReorderSections() {
  return useReorder<CustomSection[]>({
    queryKey: [...customSectionKeys.all, "active"],
    mutationFn: reorderSections,
    applyOptimistic: (sections, ids) => reorderByIds(sections, ids),
  });
}

function useSectionTransition(mutationFn: (id: number) => Promise<{ id: number }>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customSectionKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useArchiveSection() {
  return useSectionTransition(archiveSection);
}
export function useUnarchiveSection() {
  return useSectionTransition(unarchiveSection);
}
export function useRestoreSection() {
  return useSectionTransition(restoreSection);
}
export function usePurgeSection() {
  return useSectionTransition(purgeSection);
}

export function useReorderItems(sectionId: number) {
  return useReorder<CustomSection[]>({
    queryKey: customSectionKeys.all,
    mutationFn: (ids) => reorderItems(sectionId, ids),
    applyOptimistic: (sections, ids) =>
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: reorderByIds(section.items, ids) }
          : section,
      ),
  });
}
