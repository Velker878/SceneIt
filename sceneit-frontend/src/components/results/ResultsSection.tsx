"use client";

import { useStore } from "@/stores/useStore";
import { useCompare } from "@/hooks/useCompare";
import { RecommendedMovieCard } from "@/components/movies/RecommendedMovieCard";
import { SharedMoviesGrid } from "@/components/movies/SharedMoviesGrid";
import { FilterBar } from "@/components/filters/FilterBar";
import { StatsBar } from "./StatsBar";
import { ErrorState } from "./ErrorState";

export function ResultsSection() {
  const { result, isError, error } = useCompare();

  if (isError) {
    return <ErrorState message={error ?? "Something went wrong"} />;
  }

  if (!result) return null;

  return (
    <div className="space-y-8">
      {/* Stats banner */}
      <StatsBar result={result} />

      {/* Top recommendation */}
      <RecommendedMovieCard movie={result.recommendedMovie} />

      {/* Filter / sort bar */}
      <FilterBar movies={result.sharedMovies} />

      {/* All shared movies grid */}
      <SharedMoviesGrid
        movies={result.sharedMovies}
        recommendedSlug={result.recommendedMovie.letterboxdSlug}
      />
    </div>
  );
}
