# Shared UI components

The controls adapt the official [shadcn/ui new-york-v4 registry](https://ui.shadcn.com/r/styles/new-york-v4/button.json), inspected on 2026-10-31. Source is owned locally, styled with Tailwind CSS v4, and uses the existing pinned Radix primitives for keyboard/focus behavior. The original MIT notice is retained in LICENSE.md.

- Button keeps the existing outline default and protected button type; explicit default variants are primary. Slot supports links. Icon buttons require accessible labels.
- Tabs use the shadcn segmented treatment within full-width workspace headers. Radix retains arrow/Home/End navigation and activation.
- Dialog keeps Radix focus trapping, Escape, descriptions and restoration, plus the existing wider recovery-document layout.
- Input, native Select, Textarea and Label share borders, disabled/invalid states and visible focus rings. Textarea stays vertically resizable.
- Card keeps the semantic section element and product-owned padding. Badge and Alert retain domain-specific success/warning/error tones.
- StatusIndicator and recovery-copy geometry remain small product-specific extensions.

`src/theme.css` is the Tailwind entry point, `tokens.css` owns the Neutral theme with blue primary actions, and `styles.css` / `features/design/studio.css` own product geometry. The `.dark` class and existing `data-theme` attribute are synchronized using the existing stored preference. Standard `muted` and `accent` tokens mean surfaces; use `muted-foreground` for secondary text and `primary` for blue emphasis.

`cn()` merges conflicting utilities with tailwind-merge. components.json and the Vite/TypeScript `@/` alias support adding further shadcn components. Only add a control when a product need calls for it. The existing editor, source drafts, grading, and server contracts do not depend on the UI toolkit.

Tailwind Preflight is deliberately omitted during incremental adoption so the document, Monaco, React Flow, and Markdown resets remain stable. Tailwind's theme and utilities layers are imported explicitly. Base element styles live in the lower-priority base layer; contextual product CSS can size controls without duplicating their appearance. The few legacy link actions share utility styling in ui.css.

Dependencies are exact-version pinned in package.json and package-lock.json: Tailwind and its Vite plugin 4.3.3; tailwind-merge 3.7.0. There is no runtime shadcn package or remote component/CDN request.
