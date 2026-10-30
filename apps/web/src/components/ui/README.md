# Shared UI components

These locally owned components use the [shadcn/ui](https://ui.shadcn.com/docs/components) composition and variant patterns, as inspected in the official FastAPI template, with pinned Radix primitives. Visual classes use this application's semantic CSS rather than Tailwind utilities. Keep keyboard/focus behavior in Radix and product layout outside these components.

- Button/Slot supports links and icon buttons; icon buttons require accessible labels.
- Tabs provides arrow/Home/End navigation, roving focus, activation and labeled panels.
- Dialog provides focus trapping, Escape, title/description and restoration.
- Input, native Select, Textarea and Label share form states.
- Card, Badge, Alert and StatusIndicator share surfaces and feedback states.

Theme values belong in `src/tokens.css`; component states belong in `ui.css`. Existing `.button` context classes are compatibility hooks for product geometry, not a second button implementation. New dependencies are exact-version pinned in package.json and package-lock.json.
