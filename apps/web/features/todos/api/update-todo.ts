import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";
import type { Todo, TodoStatus } from "../types";
import { getTodoQueryOptions } from "./get-todo";
import { getTodosQueryOptions } from "./get-todos";

type UpdateTodoInput = {
  title: string | null;
  description: string | null;
  dueDate: string | null;
  status: TodoStatus | null;
};

export const useUpdateTodo = (publicId: string, username?: string) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.apiToken ?? "";

  return useMutation({
    mutationFn: (input: UpdateTodoInput) =>
      api.patch<Todo>(`/tasks/${publicId}`, input, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(getTodoQueryOptions(publicId));
      if (username) {
        queryClient.invalidateQueries(getTodosQueryOptions(username));
      }
    },
  });
};
