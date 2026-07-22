"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { ContentState } from "@/lib/content-state";
import type { CourseEntry, CourseInput } from "../types";
import {
  archiveCourse,
  createCourse,
  deleteCourse,
  getCourse,
  getCourses,
  purgeCourse,
  reorderCourses,
  restoreCourse,
  unarchiveCourse,
  updateCourse,
} from "./course-api";
import { reorderByIds } from "@/lib/reorder/reorder-by-ids";
import { useReorder } from "@/lib/reorder/use-reorder";

export const courseKeys = {
  all: ["courses"] as const,
  detail: (id: number) => ["courses", id] as const,
};

export function useCourses(state: ContentState = "active") {
  return useQuery({
    queryKey: [...courseKeys.all, state],
    queryFn: () => getCourses(state),
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => getCourse(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CourseInput }) =>
      updateCourse(id, input),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({
          queryKey: courseKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useReorderCourses() {
  return useReorder<CourseEntry[]>({
    queryKey: [...courseKeys.all, "active"],
    mutationFn: reorderCourses,
    applyOptimistic: (items, ids) => reorderByIds(items, ids),
  });
}

function useCourseTransition(
  mutationFn: (id: number) => Promise<{ id: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useArchiveCourse() {
  return useCourseTransition(archiveCourse);
}
export function useUnarchiveCourse() {
  return useCourseTransition(unarchiveCourse);
}
export function useRestoreCourse() {
  return useCourseTransition(restoreCourse);
}
export function usePurgeCourse() {
  return useCourseTransition(purgeCourse);
}
