import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LinearProgress } from "@mui/material";
const MainLayout = React.lazy(() => import("./layouts/MainLayout"));
const Home = React.lazy(() => import("./pages/Home"));
const Products = React.lazy(() => import("./pages/Products"));
const Scans = React.lazy(() => import("./pages/Scans"));
const SignIn = React.lazy(() => import("./pages/SignIn"));
const SignUp = React.lazy(() => import("./pages/SignUp"));
const Tags = React.lazy(() => import("./pages/Tags"));
const Users = React.lazy(() => import("./pages/Users"));

export default function App() {

  return (
    <React.Suspense fallback={<LinearProgress />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/scans" element={<Scans />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/users" element={<Users />} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}
