# SceneIt — Frontend

Next.js 14 (App Router) frontend for SceneIt.

## Prerequisites

- Node.js 18+
- The SceneIt backend running on `http://localhost:3001`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. .env.local is already configured for local dev
#    NEXT_PUBLIC_API_URL=http://localhost:3001
#    Edit if your backend runs on a different port

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, font loading
│   ├── page.tsx            # Main page (Hero + MainContent)
│   └── globals.css         # Global styles, fonts, animations
│
├── components/
│   ├── layout/
│   │   ├── Providers.tsx   # TanStack Query provider
│   │   ├── Hero.tsx        # Cinematic landing section
│   │   └── MainContent.tsx # User input panel + results
│   │
│   ├── users/
│   │   ├── UserInputSection.tsx  # Dynamic username list
│   │   ├── UserInputRow.tsx      # Single input + avatar + status
│   │   └── CompareButton.tsx     # CTA + mood selector
│   │
│   ├── movies/
│   │   ├── RecommendedMovieCard.tsx  # Hero card for top pick
│   │   ├── MoviePosterCard.tsx       # Poster card with hover
│   │   └── SharedMoviesGrid.tsx      # Responsive poster grid
│   │
│   ├── results/
│   │   ├── ResultsSection.tsx  # Orchestrates results layout
│   │   ├── StatsBar.tsx        # Shared count + genre stats
│   │   └── ErrorState.tsx      # Friendly error display
│   │
│   └── filters/
│       └── FilterBar.tsx  # Genre, decade, rating, runtime, sort
│
├── hooks/
│   ├── useCompare.ts        # Compare API call + state
│   └── useValidateUser.ts   # Debounced username validation
│
├── lib/
│   ├── api.ts               # All backend API calls
│   └── utils.ts             # cn(), formatRuntime(), filters
│
├── stores/
│   └── useStore.ts          # Zustand store (users, compare, filters)
│
└── types/
    └── index.ts             # All TypeScript types (mirrors backend)
```

## Design System

Fonts: **DM Serif Display** (titles) + **DM Sans** (body) + **DM Mono** (labels)

Colors defined in `tailwind.config.js` under the `scene` namespace:

- `scene-bg` — near-black background
- `scene-amber` — primary accent (warm film amber)
- `scene-text` — warm white text
- `scene-surface` / `scene-elevated` — card backgrounds
