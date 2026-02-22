import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Todo } from "../types";

const getTodos = (username: string): Promise<Todo[]> =>
  api.get<Todo[]>(`/users/${username}/tasks`);

export const getTodosQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ["todos", { username }],
    queryFn: () => getTodos(username),
  });

export const useTodos = (username: string) =>
  useQuery(getTodosQueryOptions(username));
