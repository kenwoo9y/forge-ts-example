import { useMutation, useQueryClient } from "@tanstack/react-query";

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

const updateTodo = (publicId: string, input: UpdateTodoInput): Promise<Todo> =>
  api.patch<Todo>(`/tasks/${publicId}`, input);

export const useUpdateTodo = (publicId: string, username?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTodoInput) => updateTodo(publicId, input),
    onSuccess: () => {
      queryClient.invalidateQueries(getTodoQueryOptions(publicId));
      if (username) {
        queryClient.invalidateQueries(getTodosQueryOptions(username));
      }
    },
  });
};
