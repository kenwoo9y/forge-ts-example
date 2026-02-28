import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";
import { getTodosQueryOptions } from "./get-todos";

export const useDeleteTodo = (publicId: string, username?: string) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.apiToken ?? "";

  return useMutation({
    mutationFn: () =>
      api.delete(`/tasks/${publicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => {
      if (username) {
        queryClient.invalidateQueries(getTodosQueryOptions(username));
      }
    },
  });
};
