import { queryOptions, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";
import type { Todo } from "../types";

export const getTodoQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: ["todos", publicId],
    queryFn: () => api.get<Todo>(`/tasks/${publicId}`),
  });

export const useTodo = (publicId: string) => {
  const { data: session } = useSession();
  const token = session?.apiToken ?? "";

  return useQuery({
    queryKey: ["todos", publicId],
    queryFn: () =>
      api.get<Todo>(`/tasks/${publicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!token,
  });
};
