import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { getTodosQueryOptions } from "./get-todos";

const deleteTodo = (publicId: string): Promise<void> =>
  api.delete(`/tasks/${publicId}`);

export const useDeleteTodo = (publicId: string, username?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteTodo(publicId),
    onSuccess: () => {
      if (username) {
        queryClient.invalidateQueries(getTodosQueryOptions(username));
      }
    },
  });
};
