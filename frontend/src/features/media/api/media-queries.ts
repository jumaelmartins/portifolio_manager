"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteImage,
  getMedia,
  updateImageDescription,
  uploadImage,
} from "./media-api";

export const mediaKeys = {
  all: ["images"] as const,
};

export function useMediaImages() {
  return useQuery({ queryKey: mediaKeys.all, queryFn: getMedia });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useUpdateImageDescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      description,
    }: {
      id: number;
      description: string | null;
    }) => updateImageDescription(id, description),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}
