"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { applyFiltersAndSort } from "@/lib/utils";
import { MoviePosterCard } from "./MoviePosterCard";
import type { ScoredMovie } from "@/types";

interface Props {
  movies: ScoredMovie[];
  recommendedSlug: string;
}

export function SharedMoviesGrid({ movies, recommendedSlug }: Props) {
  const { filters } = useStore();

  const filtered = useMemo(
    () => applyFiltersAndSort(movies, filters),
    [movies, filters],
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 text-scene-text-dim text-sm">
        <p>No movies match the current filters.</p>
        <p className="text-xs mt-1 opacity-60">Try removing some filters.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-mono text-scene-text-dim mb-4 uppercase tracking-wider">
        {filtered.length} of {movies.length} shared movies
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 md:gap-3">
        {filtered.map((movie, i) => (
          <motion.div
            key={movie.letterboxdSlug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
          >
            <MoviePosterCard
              movie={movie}
              isRecommended={movie.letterboxdSlug === recommendedSlug}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
