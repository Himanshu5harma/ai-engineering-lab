# shadcn/ui theme adoption — 2026-10-31

The user preferred the shadcn/ui theme after comparing the existing semantic-CSS adaptation with the standard Tailwind approach. Adopt its Neutral surface/foreground pairs and shared component styling with one blue primary color. Preserve spacious coding and architecture workspaces and the existing control set.

The implementation follows the official [Vite setup](https://ui.shadcn.com/docs/installation/vite), [theme token conventions](https://ui.shadcn.com/docs/theming), and new-york-v4 component registry. It adds pinned Tailwind CSS / @tailwindcss/vite 4.3.3 and tailwind-merge 3.7.0. Existing Radix primitives and CVA remain; no second primitive framework or component CLI dependency is needed. Adapted source attribution is retained next to the components.

The shared controls now use Tailwind utilities, with product geometry retained in the existing CSS. Neutral light/dark surfaces replace the previous blue-gray palette; pill navigation and segmented tabs make active states clearer. Monaco uses matching neutral editor surfaces with readable Python syntax colors. Existing browser theme preferences are preserved.

Two old aliases conflicted with shadcn semantics: muted formerly meant text, and accent formerly meant blue. Product references now use muted-foreground and primary so standard shadcn components can safely use muted/accent as surfaces. Base element styles are layered below utilities. Tailwind Preflight is omitted to preserve the existing Markdown, Monaco, and React Flow resets during this incremental migration.

No endpoint, database, curriculum identity, grading, sandbox, source-draft key, or save/recovery behavior is changed. The local web container can be rebuilt independently of the API and worker.

Verification: 21 frontend unit tests, ESLint, generated API freshness, TypeScript/Vite, formatting and diff checks passed. The clean Docker web build also passed. Six existing editor/layout browser tests passed through the actual local Nginx at 8080, covering formatter undo/stale-edit protection, draft/font restoration, fullscreen, resizing, output visibility and responsive page geometry. A separate read-only sweep passed 64 combinations (eight sections × two themes × 1366×768, 1477×871, 820×1180 and 390×844). It checked synchronized theme state, working editor width, at least 12 laptop code lines, visible execution controls, canvas space, full Save/Export button bounds and keyboard tabs. Dialog focus trapping, Escape and focus restoration passed separately. No practice API writes occurred. Visual review caught and fixed mobile Studio Save clipping.

Screenshots and their gallery are in ignored output/playwright/shadcn/. The existing local web container was refreshed independently; API, worker and database were left running. No backend changes were made or backend suites rerun for this styling pass. Existing bundle-size warnings remain non-blocking.
