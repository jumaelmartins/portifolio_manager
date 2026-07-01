"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CustomItemInput, CustomSectionInput } from "../types";
import {
  createItem,
  createSection,
  deleteItem,
  deleteSection,
  fetchSections,
  updateItem,
  updateSection,
} from "./custom-sections-api";

export const customSectionKeys = {
  all: ["custom-sections"] as const,
};

export function useSections() {
  return useQuery({
    queryKey: customSectionKeys.all,
    queryFn: fetchSections,
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
