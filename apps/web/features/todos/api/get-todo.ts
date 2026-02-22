import { queryOptions, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Todo } from "../types";

const getTodo = (publicId: string): Promise<Todo> =>
  api.get<Todo>(`/tasks/${publicId}`);

export const getTodoQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: ["todos", publicId],
    queryFn: () => getTodo(publicId),
  });

export const useTodo = (publicId: string) =>
  useQuery(getTodoQueryOptions(publicId));
