import { queryOptions, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";
import type { Todo } from "../types";

export const getTodosQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ["todos", { username }],
    queryFn: () => api.get<Todo[]>(`/users/${username}/tasks`),
  });

export const useTodos = (username: string) => {
  const { data: session } = useSession();
  const token = session?.apiToken ?? "";

  return useQuery({
    queryKey: ["todos", { username }],
    queryFn: () =>
      api.get<Todo[]>(`/users/${username}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
  });
};
