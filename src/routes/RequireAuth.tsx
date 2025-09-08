import type { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../api/auth";

export default function RequireAuth({ children }: { children: JSX.Element }) {
    const { data: me, status, isFetching, isLoading } = useMe();
    const loc = useLocation();

    // While we’re verifying (first load) don’t flicker or redirect
    if (!!!me && (status === "pending" || isFetching || isLoading)) return null;

    if (!!!me) {
        return <Navigate to="/signin" replace state={{ from: loc }} />;
    }
    return children;
}
