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

import { fetchProductsByIds } from "../api/products"; // your feature fetcher
import Invoices from "../pages/Invoices";

export async function invoiceLoader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const idsParam = url.searchParams.getAll("ids");

    const ids: number[] = [
        ...idsParam.flatMap(v => v.split(",")),
    ]
        .map(s => Number(s))
        .filter(n => Number.isInteger(n));
    // basic guards
    if (ids.length === 0) throw redirect("/products");
    if (ids.length > 100) throw new Response("Too many ids (max 100).", { status: 400 });

    // de-dup so the API/db doesn't do extra work
    const uniqueIds = Array.from(new Set(ids));

    try {
        const products = await fetchProductsByIds(uniqueIds); // one request
        if (!products || products.length === 0) {
            throw new Response("Not Found", { status: 404 });
        }
        // (optional) ensure every requested id exists
        const returnedIds = new Set(products.map(p => p.id));
        const missing = uniqueIds.filter(id => !returnedIds.has(id));
        if (missing.length) {
            // you can choose to 404 or return partials depending on UX
            throw new Response(`Missing ids: ${missing.join(",")}`, { status: 404 });
        }

        return { products };
    } catch (e) {
        throw e instanceof Response ? e : new Response("Not Found", { status: 404 });
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
                    { path: "invoices", element: <Invoices /> },
                    { path: "products", element: <Products /> },
                    { path: "scan-mode", element: <ScanMode /> },
                    { path: "tags", element: <Tags /> },
                    { path: "users", element: <Users /> },
                    { path: "issue-invoice", loader: invoiceLoader, element: <IssueInvoice /> },
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
