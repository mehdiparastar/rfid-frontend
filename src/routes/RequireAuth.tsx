import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../api/auth";
import { AppSocketConnector } from "../AppSocketConnector";

export default function RequireAuth() {
    const { data: me, status, isFetching, isLoading } = useMe();
    const loc = useLocation();

    // While verifying (first load) don't flicker or redirect
    if (!me && (status === "pending" || isFetching || isLoading)) return null;

    if (!me) {
        return <Navigate to="/signin" replace state={{ from: loc }} />;
    }

    return (
        <>
            <AppSocketConnector />
            <Outlet /> {/* renders nested protected routes */}
        </>
    );
}
