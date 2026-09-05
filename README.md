# Chunk

Expo (React Native) app, built with TypeScript and [expo-router](https://docs.expo.dev/router/introduction) for file-based navigation.

## Getting started

```bash
npm install
npx expo start
```

## Project structure

This is a skeleton — no screens have been built yet. Here's what goes where:

- **`src/app/`** — Routes and layouts, following expo-router's file-based routing. Each file here becomes a screen; folders create nested routes. `_layout.tsx` files define shared layout/navigation (stacks, tabs) for the routes below them. Keep this directory limited to routing and screen composition — pull actual UI and logic into `components/`.

- **`src/components/`** — Reusable React components shared across screens (buttons, cards, list items, etc.). Anything more complex than a one-off bit of screen markup belongs here rather than inline in a route file.

- **`src/constants/`** — Static, app-wide values: theme/colors, spacing, typography, layout constants, config values that don't change at runtime.

- **`assets/`** — Static files bundled with the app: images, icons, fonts, splash screens. Referenced from code via `require(...)` or `import`.

- **`reference/`** — Design reference material (exported design canvas artboards, mascot art, screenshots) unzipped from the design export. Not app source — it's git-ignored and exists only to guide implementation of screens/components against the design.

## Notes

- Entry point is `expo-router/entry` (set in `package.json`), which boots the router against `src/app/`.
- `src/app/index.tsx` and `src/app/_layout.tsx` currently contain only placeholder content — real screens haven't been implemented yet.
