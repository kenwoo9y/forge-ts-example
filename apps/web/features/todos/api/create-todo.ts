import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Todo, TodoStatus } from "../types";
import { getTodosQueryOptions } from "./get-todos";

type CreateTodoInput = {
  title: string | null;
  description: string | null;
  dueDate: string | null;
  status: TodoStatus | null;
};

const createTodo = (input: CreateTodoInput): Promise<Todo> =>
  api.post<Todo>("/tasks", input);

export const useCreateTodo = (username: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(getTodosQueryOptions(username));
    },
  });
};
