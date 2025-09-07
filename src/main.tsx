import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { UiProvider } from "./ui/UiProvider";
import { BrowserRouter } from "react-router-dom";

// Recommended by MUI for consistent typography rendering
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UiProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </UiProvider>
  </React.StrictMode>
);
