import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export type UserRow = { id: number; email: string; roles: string[] | null };
export type UsersResponse = UserRow[];

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: () => api<UsersResponse>("/api/users"),
        staleTime: 60_000,
    });
}

export function useUpdateUserRoles() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
            api<UserRow>(`/api/users/${id}/roles`, {
                method: "PATCH",
                body: JSON.stringify({ roles }),
            }),
        // optimistic update
        onMutate: async ({ id, roles }) => {
            await qc.cancelQueries({ queryKey: ["users"] });
            const prev = qc.getQueryData<UsersResponse>(["users"]);
            if (prev) {
                const next = prev.map((u) => (u.id === id ? { ...u, roles } : u));
                qc.setQueryData(["users"], next);
            }
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(["users"], ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
