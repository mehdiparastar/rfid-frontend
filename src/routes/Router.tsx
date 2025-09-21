import * as React from "react";
import {
    createBrowserRouter,
    RouterProvider,
    redirect,
    type LoaderFunctionArgs,
} from "react-router-dom";
import { LinearProgress } from "@mui/material";

import RequireAuth from "./RequireAuth";

const MainLayout = React.lazy(() => import("../layouts/MainLayout"));
const Home = React.lazy(() => import("../pages/Home"));
const Products = React.lazy(() => import("../pages/Products"));
const ScanMode = React.lazy(() => import("../pages/ScanMode/ScanMode"));
const SignIn = React.lazy(() => import("../pages/SignIn"));
const SignUp = React.lazy(() => import("../pages/SignUp"));
const Tags = React.lazy(() => import("../pages/Tags"));
const Users = React.lazy(() => import("../pages/Users"));
const IssueInvoice = React.lazy(() => import("../pages/IssueInvoice"));

import { fetchProduct } from "../api/products"; // your feature fetcher

export async function invoiceLoader({ params }: LoaderFunctionArgs) {
    const id = params.id;
    if (!id) throw redirect("/products");
    try {
        const product = await fetchProduct(id);
        if (!product) throw new Response("Not Found", { status: 404 });
        return { product };
    } catch {
        throw new Response("Not Found", { status: 404 });
    }
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <div style={{ padding: 24 }}>Not Found</div>,
        children: [
            { index: true, loader: () => redirect("/home") },
            { path: "home", element: <Home /> },

            // public
            { path: "signin", element: <SignIn /> },
            { path: "signup", element: <SignUp /> },

            // protected group (no children prop needed; uses <Outlet/> in RequireAuth)
            {
                element: <RequireAuth />,
                children: [
                    { path: "products", element: <Products /> },
                    { path: "scan-mode", element: <ScanMode /> },
                    { path: "tags", element: <Tags /> },
                    { path: "users", element: <Users /> },
                    { path: "issue-invoice/:id", loader: invoiceLoader, element: <IssueInvoice /> },
                ],
            },
        ],
    },
]);

export default function AppRouter() {
    return (
        <React.Suspense fallback={<LinearProgress />}>
            <RouterProvider router={router} />
        </React.Suspense>
    );
}
