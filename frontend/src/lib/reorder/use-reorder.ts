"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ReorderContext<TData> = { previous: TData | undefined };

export function useReorder<TData>(options: {
  queryKey: readonly unknown[];
  mutationFn: (ids: number[]) => Promise<unknown>;
  applyOptimistic: (data: TData, ids: number[]) => TData;
}) {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, number[], ReorderContext<TData>>({
    mutationFn: (ids) => options.mutationFn(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<TData>(options.queryKey);
      if (previous !== undefined) {
        queryClient.setQueryData<TData>(
          options.queryKey,
          options.applyOptimistic(previous, ids),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
      toast.error("Could not save the new order. Please try again.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}
