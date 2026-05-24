import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FilterState, ScoredMovie, SortOption } from "@/types";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "142" → "2h 22m" */
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 7.8 → "7.8" — already one decimal; handles null */
export function formatRating(rating: number | null): string {
  if (rating === null) return "N/A";
  return rating.toFixed(1);
}

/** "2024-03-15" → "2024" */
export function formatYear(
  releaseDate: string | null,
  fallback: number | null,
): string {
  if (releaseDate) return releaseDate.slice(0, 4);
  if (fallback) return String(fallback);
  return "N/A";
}

/** Extract decade string from year: 2013 → "2010s" */
export function yearToDecade(year: number | null): string | null {
  if (!year) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

/**
 * Apply active filters and sort to a list of shared movies.
 * Called client-side so filtering is instant.
 */
export function applyFiltersAndSort(
  movies: ScoredMovie[],
  filters: FilterState,
): ScoredMovie[] {
  let result = [...movies];

  // ── Genre filter ──────────────────────────────────────────────────────────
  if (filters.genres.length > 0) {
    result = result.filter((m) =>
      filters.genres.every((g) => m.genres.includes(g)),
    );
  }

  // ── Runtime filter ────────────────────────────────────────────────────────
  if (filters.maxRuntime !== null) {
    result = result.filter(
      (m) => m.runtime === null || m.runtime <= filters.maxRuntime!,
    );
  }

  // ── Rating filter ─────────────────────────────────────────────────────────
  if (filters.minRating !== null) {
    result = result.filter(
      (m) => m.tmdbRating !== null && m.tmdbRating >= filters.minRating!,
    );
  }

  // ── Decade filter ─────────────────────────────────────────────────────────
  if (filters.decade) {
    const decadeStart = parseInt(filters.decade.slice(0, 4), 10);
    result = result.filter((m) => {
      if (!m.year) return false;
      return m.year >= decadeStart && m.year < decadeStart + 10;
    });
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  result.sort((a, b) => {
    switch (filters.sort) {
      case "score":
        return b.score - a.score;
      case "rating":
        return (b.tmdbRating ?? 0) - (a.tmdbRating ?? 0);
      case "popular":
        return b.popularity - a.popularity;
      case "runtime_asc":
        return (a.runtime ?? 999) - (b.runtime ?? 999);
      case "runtime_desc":
        return (b.runtime ?? 0) - (a.runtime ?? 0);
      case "year_asc":
        return (a.year ?? 0) - (b.year ?? 0);
      case "year_desc":
        return (b.year ?? 0) - (a.year ?? 0);
      default:
        return b.score - a.score;
    }
  });

  return result;
}

/** Derive all unique genres from a list of movies — for building filter options */
export function extractGenres(movies: ScoredMovie[]): string[] {
  const set = new Set<string>();
  for (const m of movies) {
    for (const g of m.genres) set.add(g);
  }
  return Array.from(set).sort();
}

/** Derive all unique decades from a list of movies */
export function extractDecades(movies: ScoredMovie[]): string[] {
  const set = new Set<string>();
  for (const m of movies) {
    const d = yearToDecade(m.year);
    if (d) set.add(d);
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a)); // newest first
}
