import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";

type UpdateUserResponse = {
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
};

export const useUpdateProfile = () => {
  const { data: session } = useSession();
  const username = session?.user?.name ?? "";
  const token = session?.apiToken ?? "";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      firstName?: string | null;
      lastName?: string | null;
    }) =>
      api.patch<UpdateUserResponse>(`/users/${username}`, input, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", username] });
    },
  });
};

export const useUpdatePassword = () => {
  const { data: session } = useSession();
  const username = session?.user?.name ?? "";
  const token = session?.apiToken ?? "";

  return useMutation({
    mutationFn: (input: { password: string }) =>
      api.patch<UpdateUserResponse>(`/users/${username}`, input, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  });
};
