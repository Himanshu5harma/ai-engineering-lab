import React, { lazy, Suspense, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Arena } from "./features/arena/Arena";
import { Catalog } from "./pages/Catalog";
import { Dashboard } from "./pages/Dashboard";
import { Activity } from "./pages/Activity";
import { Progress } from "./pages/Progress";
import { Curriculum } from "./pages/Curriculum";
import { DesignCatalog } from "./pages/DesignCatalog";
const DesignStudio = lazy(() =>
  import("./features/design/DesignStudio").then((module) => ({
    default: module.DesignStudio,
  })),
);
import "./tokens.css";
import "./components/ui/ui.css";
import "./styles.css";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ael-theme-minimal") || "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ael-theme-minimal", theme);
    } catch {
      /* Theme still works if browser storage is unavailable. */
    }
  }, [theme]);
  return (
    <Routes>
      <Route
        element={
          <Shell
            theme={theme}
            toggleTheme={() =>
              setTheme((t) => (t === "dark" ? "light" : "dark"))
            }
          />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="arena" element={<Catalog />} />
        <Route path="activity" element={<Activity />} />
        <Route path="progress" element={<Progress />} />
        <Route path="curriculum" element={<Curriculum />} />
        <Route path="design" element={<DesignCatalog />} />
        <Route
          path="design/:slug"
          element={
            <Suspense
              fallback={
                <div className="page" role="status">
                  Loading design canvas…
                </div>
              }
            >
              <DesignStudio theme={theme} />
            </Suspense>
          }
        />
        <Route path="arena/:slug" element={<Arena theme={theme} />} />
        <Route
          path="*"
          element={
            <div className="page">
              <h1>Page not found</h1>
              <Link to="/">Return to overview</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
