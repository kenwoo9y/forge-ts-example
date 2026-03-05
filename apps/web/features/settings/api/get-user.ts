import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { api } from "@/lib/api-client";

type UserResponse = {
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
};

export const useGetUser = () => {
  const { data: session } = useSession();
  const username = session?.user?.name ?? "";
  const token = session?.apiToken ?? "";

  return useQuery({
    queryKey: ["user", username],
    queryFn: () =>
      api.get<UserResponse>(`/users/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: !!username && !!token,
  });
};
