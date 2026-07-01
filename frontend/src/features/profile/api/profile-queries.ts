// frontend/src/features/profile/api/profile-queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ProfileInput } from "../types";
import {
  changePassword,
  fetchProfile,
  updateProfile,
  uploadProfilePicture,
} from "./profile-api";

export const profileKeys = {
  me: ["profile"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.me }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
    },
  });
}
