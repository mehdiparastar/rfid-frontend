import { create } from "zustand";

export type User = { id: string; email: string; roles: string[] };
type AuthState = { user: User | null; setUser: (u: User | null) => void; };
export const useAuth = create<AuthState>((set) => ({ user: null, setUser: (u) => set({ user: u }) }));
