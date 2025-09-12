import * as React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LinearProgress } from "@mui/material";
import RequireAuth from "./routes/RequireAuth";
const MainLayout = React.lazy(() => import("./layouts/MainLayout"));
const Home = React.lazy(() => import("./pages/Home"));
const Products = React.lazy(() => import("./pages/Products"));
const ScanMode = React.lazy(() => import("./pages/ScanMode/ScanMode"));
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
          <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
          <Route path="/scan-mode" element={<RequireAuth><ScanMode /></RequireAuth>} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/tags" element={<RequireAuth><Tags /></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}
