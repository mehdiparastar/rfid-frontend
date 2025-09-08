import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export type User = { id: string; email: string; roles: string[] };

export function useMe() {
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: User }>("/api/auth/me"),
    select: (d) => d.user,
  });

  return q; // {data?: User, isLoading, error, ...}
}

export function useLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: ({ user }) => {
      qc.setQueryData(["me"], user); // prime cache
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["me"], exact: true });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: ({ user }) => {
      qc.setQueryData(["me"], user); // user is now logged in via cookies
    },
  });
}