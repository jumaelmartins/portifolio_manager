"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { TechnologyInput } from "../types";
import {
  createTechnology,
  deleteTechnology,
  getTechnologies,
  getTechnology,
  updateTechnology,
} from "./technology-api";

export const technologyKeys = {
  all: ["technologies"] as const,
  detail: (id: number) => ["technologies", id] as const,
};

export function useTechnologies() {
  return useQuery({
    queryKey: technologyKeys.all,
    queryFn: getTechnologies,
  });
}

export function useTechnology(id: number) {
  return useQuery({
    queryKey: technologyKeys.detail(id),
    queryFn: () => getTechnology(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTechnology,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: technologyKeys.all });
    },
  });
}

export function useUpdateTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TechnologyInput }) =>
      updateTechnology(id, input),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: technologyKeys.all }),
        queryClient.invalidateQueries({
          queryKey: technologyKeys.detail(variables.id),
        }),
      ]);
    },
  });
}

export function useDeleteTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTechnology,
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: technologyKeys.all }),
        queryClient.invalidateQueries({ queryKey: technologyKeys.detail(id) }),
      ]);
    },
  });
}
