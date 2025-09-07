import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../api/auth";
import type { JSX } from "react";

export default function RequireAuth({ children }: { children: JSX.Element }) {
    const { data: user, isLoading } = useMe();
    const loc = useLocation();
    if (isLoading) return null; // or a spinner
    if (!user) return <Navigate to="/signin" replace state={{ from: loc }} />;
    return children;
}
