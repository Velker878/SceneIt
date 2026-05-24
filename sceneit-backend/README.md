# SceneIt — Backend

NestJS API server powering the SceneIt watchlist comparison app.

## Prerequisites

- Node.js 18+
- Redis (local or [Upstash](https://upstash.com) for production)
- TMDB API key — [get one free](https://www.themoviedb.org/settings/api)
- OpenAI API key — [get one here](https://platform.openai.com/api-keys)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your keys
cp .env.example .env
# → Edit .env and add TMDB_API_KEY, OPENAI_API_KEY, REDIS_URL

# 3. Start Redis locally (if not using Upstash)
#    macOS with Homebrew:
brew services start redis
#    Docker:
docker run -p 6379:6379 redis:alpine

# 4. Start the dev server
npm run start:dev
```

The API will be available at **http://localhost:3001/api**

## API Endpoints

### `POST /api/letterboxd/validate`

Validate a single Letterboxd username.

**Request:**

```json
{ "username": "zach" }
```

**Response:**

```json
{
  "username": "zach",
  "status": "valid",
  "user": {
    "username": "zach",
    "displayName": "Zach",
    "avatarUrl": "https://a.ltrbxd.com/resized/..."
  }
}
```

Status values: `valid` | `not_found` | `private` | `error`

---

### `POST /api/letterboxd/validate-many`

Validate multiple usernames at once.

**Request:**

```json
{ "usernames": ["alice", "bob", "charlie"] }
```

---

### `POST /api/compare`

Full watchlist comparison. This is the main endpoint.

**Request:**

```json
{
  "usernames": ["alice", "bob"],
  "mood": "thrilling"
}
```

`mood` is optional. Valid values: `any` | `light` | `mind-bending` | `emotional` | `funny` | `thrilling` | `romantic`

**Response:**

```json
{
  "usernames": ["alice", "bob"],
  "recommendedMovie": {
    "tmdbId": 155,
    "title": "The Dark Knight",
    "year": 2008,
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "backdropUrl": "https://image.tmdb.org/t/p/w1280/...",
    "genres": ["Action", "Crime", "Drama"],
    "runtime": 152,
    "tmdbRating": 9.0,
    "overview": "...",
    "director": "Christopher Nolan",
    "topCast": ["Christian Bale", "Heath Ledger", "..."],
    "letterboxdUrl": "https://letterboxd.com/film/the-dark-knight/",
    "score": 0.891,
    "scoreBreakdown": { ... },
    "aiExplanation": "Since both of you have dark, character-driven films..."
  },
  "sharedMovies": [ ... ],
  "stats": {
    "sharedCount": 23,
    "topSharedGenres": ["Drama", "Thriller", "Crime"],
    "averageRating": 7.4,
    "watchlistSizes": { "alice": 312, "bob": 187 }
  }
}
```

## Project Structure

```
src/
├── main.ts                          # Bootstrap
├── app.module.ts                    # Root module + Redis cache
│
├── letterboxd/
│   ├── letterboxd.module.ts
│   ├── letterboxd.service.ts        # ⭐ Scraping engine (port of Python scraper)
│   ├── letterboxd.controller.ts     # /api/letterboxd routes
│   └── dto/
│       └── validate-user.dto.ts
│
├── tmdb/
│   ├── tmdb.module.ts
│   └── tmdb.service.ts              # TMDB enrichment + caching
│
├── compare/
│   ├── compare.module.ts
│   ├── compare.controller.ts        # POST /api/compare
│   ├── compare.service.ts           # ⭐ Main orchestrator
│   ├── scoring.service.ts           # Recommendation algorithm
│   ├── ai-recommendation.service.ts # OpenAI explanation generator
│   └── dto/
│       └── compare.dto.ts
│
└── common/
    └── filters/
        └── global-exception.filter.ts
```

## Caching Strategy

| What             | Cache Key                      | TTL      |
| ---------------- | ------------------------------ | -------- |
| Watchlist scrape | `watchlist:{username}`         | 8 hours  |
| TMDB movie data  | `tmdb:{slug}`                  | 24 hours |
| AI explanation   | `ai:rec:{slug}:{users}:{mood}` | 24 hours |

TTLs are configurable via `.env`.

## Performance Notes

- Watchlists for multiple users are scraped **in parallel**
- Each watchlist paginates **sequentially** (polite to Letterboxd)
- TMDB enrichment runs with **concurrency limit of 8**
- All results are Redis-cached — repeat comparisons are near-instant

## Environment Variables

| Variable              | Required | Default                  | Description                            |
| --------------------- | -------- | ------------------------ | -------------------------------------- |
| `PORT`                | No       | `3001`                   | Server port                            |
| `TMDB_API_KEY`        | ✅       | —                        | TMDB v3 API key                        |
| `OPENAI_API_KEY`      | ✅       | —                        | OpenAI API key                         |
| `REDIS_URL`           | No       | `redis://localhost:6379` | Redis connection URL                   |
| `WATCHLIST_CACHE_TTL` | No       | `28800`                  | Watchlist cache TTL in seconds (8h)    |
| `TMDB_CACHE_TTL`      | No       | `86400`                  | TMDB cache TTL in seconds (24h)        |
| `SCRAPE_DELAY_MS`     | No       | `800`                    | Delay between Letterboxd page requests |
