
# Culinary Muse AI

Culinary Muse AI is a small frontend app that helps users discover and interact with AI-powered recipe and meal suggestions. It includes a chat-style assistant, preference form, visual pantry/`VisualFridge` display, recipe viewer, and a music player for a more delightful cooking experience.

**Key Features**
- **AI Chat Assistant:** Conversational recipe and cooking guidance via the `ChatWidget`.
- **Preferences:** Save dietary preferences and constraints with `PreferenceForm`.
- **Recipe Display:** Nicely formatted recipe view in `RecipeDisplay`.
- **Visual Fridge:** Visualize ingredients and suggested uses with `VisualFridge`.
- **Ambient Music:** Lightweight `MusicPlayer` to play background music while cooking.

**Tech Stack**
- Framework: Vite + React + TypeScript
- Bundler/dev server: Vite
- Location: UI code lives at the repo root and the `components` folder.

Getting started
--------------

Requirements
- Node.js (16+) and npm or yarn

Install

```bash
npm install
# or
yarn
```

Run (development)

```bash
npm run dev
# or
yarn dev
```

Build

```bash
npm run build
# or
yarn build
```

Preview production build

```bash
npm run preview
# or
yarn preview
```

Project layout
--------------
- **App entry & config:** [App.tsx](App.tsx), [index.tsx](index.tsx), [index.html](index.html), [vite.config.ts](vite.config.ts)
- **Main components:** [components/ChatWidget.tsx](components/ChatWidget.tsx), [components/PreferenceForm.tsx](components/PreferenceForm.tsx), [components/RecipeDisplay.tsx](components/RecipeDisplay.tsx), [components/VisualFridge.tsx](components/VisualFridge.tsx), [components/MusicPlayer.tsx](components/MusicPlayer.tsx)
- **Services:** [services/geminiService.ts](services/geminiService.ts)
- **Config & types:** [tsconfig.json](tsconfig.json), [types.ts](types.ts), [package.json](package.json)

Development notes
-----------------
- The chat and AI interactions are proxied through `services/geminiService.ts`. Update this file with appropriate API keys and endpoints when integrating an AI backend.
- UI components are small and focused; expand or refactor as features grow.

Testing & linting
-----------------
- This project doesn't include tests by default. Consider adding `vitest` for unit tests and `eslint`/`prettier` for consistent formatting.

Deployment
----------
- Static sites built by Vite can be deployed to services like Netlify, Vercel, or GitHub Pages. Run `npm run build` and follow your platform's static site deployment steps.

Contributing
------------
- Fork the repo, create a branch for your feature/bugfix, and open a pull request. Keep changes focused and add docs or tests where appropriate.

Acknowledgements
----------------
- Built as a lightweight frontend demo for experimenting with AI-powered recipe assistance and a delightful cooking UI.


