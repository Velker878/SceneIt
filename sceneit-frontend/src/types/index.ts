// ─── Letterboxd User ──────────────────────────────────────────────────────────

export type ValidationStatus =
  | "idle"
  | "loading"
  | "valid"
  | "not_found"
  | "private"
  | "error";

export interface LetterboxdUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/** Frontend state for a single username input entry */
export interface UserEntry {
  id: string; // Local unique ID (crypto.randomUUID)
  username: string; // Raw input value
  status: ValidationStatus;
  user?: LetterboxdUser; // Populated when status === 'valid'
  reason?: string; // Populated when status is an error
}

// ─── TMDB Movie ───────────────────────────────────────────────────────────────

export interface TmdbMovie {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  year: number | null;
  overview: string;
  tagline: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  runtime: number | null;
  tmdbRating: number | null;
  voteCount: number;
  popularity: number;
  releaseDate: string | null;
  director: string | null;
  topCast: string[];
  trailerKey: string | null;
  letterboxdUrl: string;
  letterboxdSlug: string;
}

export interface ScoredMovie extends TmdbMovie {
  score: number;
  scoreBreakdown: {
    ratingScore: number;
    voteScore: number;
    popularityScore: number;
    genreScore: number;
    runtimePenalty: number;
  };
}

export interface RecommendedMovie extends ScoredMovie {
  aiExplanation: string;
}

// ─── Compare Result ───────────────────────────────────────────────────────────

export interface CompareStats {
  sharedCount: number;
  topSharedGenres: string[];
  averageRating: number | null;
  watchlistSizes: Record<string, number>;
}

export interface CompareResult {
  usernames: string[];
  recommendedMovie: RecommendedMovie;
  sharedMovies: ScoredMovie[];
  stats: CompareStats;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

// ─── Filter & Sort ────────────────────────────────────────────────────────────

export type SortOption =
  | "score" // Best match (default)
  | "rating" // Highest rated
  | "popular" // Most popular
  | "runtime_asc" // Shortest first
  | "runtime_desc" // Longest first
  | "year_asc" // Oldest first
  | "year_desc"; // Newest first

export interface FilterState {
  genres: string[]; // Active genre filters (empty = all)
  maxRuntime: number | null; // Max runtime in minutes (null = any)
  minRating: number | null; // Min TMDB rating (null = any)
  decade: string | null; // e.g. "2010s" (null = any)
  sort: SortOption;
}

export type Mood =
  | "any"
  | "light"
  | "mind-bending"
  | "emotional"
  | "funny"
  | "thrilling"
  | "romantic";
