import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Todo } from "../types";

export const getTodosQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ["todos", { username }],
    queryFn: () => api.get<Todo[]>(`/users/${username}/tasks`),
  });

export const useTodos = (username: string, token: string) => {
  return useQuery({
    queryKey: ["todos", { username }],
    queryFn: () =>
      api.get<Todo[]>(`/users/${username}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token && !!username,
  });
};
