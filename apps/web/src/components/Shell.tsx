import {
  BarChart3,
  Braces,
  Code2,
  ExternalLink,
  History,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ChallengeSearch } from "./ChallengeSearch";

export function Shell({
  theme,
  toggleTheme,
}: {
  theme: string;
  toggleTheme: () => void;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <NavLink
            to="/"
            className="brand"
            aria-label="AI Engineering Lab home"
          >
            <span className="brand-icon">
              <Braces size={22} />
            </span>
            <span>
              AI Engineering <strong>Lab</strong>
            </span>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end>
              <LayoutDashboard size={15} /> Overview
            </NavLink>
            <NavLink to="/arena">
              <Code2 size={16} />
              Coding Arena
            </NavLink>
            <NavLink to="/activity">
              <History size={15} />
              Activity
            </NavLink>
            <NavLink to="/progress">
              <BarChart3 size={16} />
              Progress
            </NavLink>
          </nav>
          <div className="top-actions">
            <ChallengeSearch />
            <span className="local-badge">
              <i />
              Local workspace
            </span>
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a
              className="icon-button"
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              aria-label="Open API documentation"
            >
              <ExternalLink size={17} />
            </a>
          </div>
        </div>
      </header>
      <main id="main-content" className="main-shell">
        <Outlet />
      </main>
    </div>
  );
}
