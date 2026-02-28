import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";
import type { Todo, TodoStatus } from "../types";
import { getTodosQueryOptions } from "./get-todos";

type CreateTodoInput = {
  title: string | null;
  description: string | null;
  dueDate: string | null;
  status: TodoStatus | null;
};

export const useCreateTodo = (username: string) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const token = session?.apiToken ?? "";

  return useMutation({
    mutationFn: (input: CreateTodoInput) =>
      api.post<Todo>(`/users/${username}/tasks`, input, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(getTodosQueryOptions(username));
    },
  });
};
