"use client";

import { useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { extractGenres, extractDecades, cn } from "@/lib/utils";
import type { ScoredMovie, SortOption } from "@/types";

interface Props {
  movies: ScoredMovie[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "score", label: "Best match" },
  { value: "rating", label: "Highest rated" },
  { value: "popular", label: "Most popular" },
  { value: "runtime_asc", label: "Shortest first" },
  { value: "runtime_desc", label: "Longest first" },
  { value: "year_desc", label: "Newest first" },
  { value: "year_asc", label: "Oldest first" },
];

const RATING_OPTIONS = [
  { value: null, label: "Any rating" },
  { value: 9, label: "9+" },
  { value: 8, label: "8+" },
  { value: 7, label: "7+" },
  { value: 6, label: "6+" },
];

const RUNTIME_OPTIONS = [
  { value: null, label: "Any length" },
  { value: 90, label: "Under 90m" },
  { value: 120, label: "Under 2h" },
  { value: 150, label: "Under 2.5h" },
];

export function FilterBar({ movies }: Props) {
  const { filters, setFilter, resetFilters } = useStore();

  const genres = useMemo(() => extractGenres(movies), [movies]);
  const decades = useMemo(() => extractDecades(movies), [movies]);

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.minRating !== null ||
    filters.maxRuntime !== null ||
    filters.decade !== null ||
    filters.sort !== "score";

  function toggleGenre(genre: string) {
    const next = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    setFilter("genres", next);
  }

  return (
    <div className="bg-scene-surface border border-scene-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-scene-amber" />
          <span className="font-mono text-xs text-scene-text-muted uppercase tracking-wider">
            Filter & Sort
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-scene-text-dim hover:text-scene-amber transition-colors"
          >
            <X size={11} />
            Reset
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs text-scene-text-dim mb-1.5">
          Sort by
        </label>
        <select
          value={filters.sort}
          onChange={(e) => setFilter("sort", e.target.value as SortOption)}
          className="w-full bg-scene-elevated border border-scene-border rounded-lg px-3 py-2 text-xs text-scene-text outline-none focus:border-scene-amber/50 transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Min rating */}
        <div>
          <label className="block text-xs text-scene-text-dim mb-1.5">
            Rating
          </label>
          <select
            value={filters.minRating ?? ""}
            onChange={(e) =>
              setFilter(
                "minRating",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="w-full bg-scene-elevated border border-scene-border rounded-lg px-3 py-2 text-xs text-scene-text outline-none focus:border-scene-amber/50 transition-colors"
          >
            {RATING_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max runtime */}
        <div>
          <label className="block text-xs text-scene-text-dim mb-1.5">
            Length
          </label>
          <select
            value={filters.maxRuntime ?? ""}
            onChange={(e) =>
              setFilter(
                "maxRuntime",
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="w-full bg-scene-elevated border border-scene-border rounded-lg px-3 py-2 text-xs text-scene-text outline-none focus:border-scene-amber/50 transition-colors"
          >
            {RUNTIME_OPTIONS.map((opt) => (
              <option key={String(opt.value)} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Decade */}
      {decades.length > 1 && (
        <div>
          <label className="block text-xs text-scene-text-dim mb-1.5">
            Decade
          </label>
          <div className="flex flex-wrap gap-1.5">
            {decades.map((d) => (
              <button
                key={d}
                onClick={() =>
                  setFilter("decade", filters.decade === d ? null : d)
                }
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
                  filters.decade === d
                    ? "bg-scene-amber/15 border border-scene-amber/40 text-scene-amber"
                    : "bg-scene-elevated border border-scene-border text-scene-text-dim hover:border-scene-muted",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Genre chips */}
      {genres.length > 0 && (
        <div>
          <label className="block text-xs text-scene-text-dim mb-1.5">
            Genres
          </label>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => {
              const active = filters.genres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs transition-all",
                    active
                      ? "bg-scene-amber/15 border border-scene-amber/40 text-scene-amber"
                      : "bg-scene-elevated border border-scene-border text-scene-text-dim hover:border-scene-muted",
                  )}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
