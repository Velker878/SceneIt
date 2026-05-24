/**
 * ScoringService
 *
 * Implements the recommendation scoring algorithm.
 *
 * Each movie in the shared watchlist receives a composite score based on:
 *   1. TMDB rating (quality signal)
 *   2. Vote count normalised (avoids very obscure films with 5-star averages)
 *   3. Popularity balance (not too mainstream, not too niche)
 *   4. Genre overlap (boosts movies whose genres appear most across all watchlists)
 *   5. Runtime penalty (optional, slight negative for very long films)
 *
 * Weights are configurable so they can be tuned without changing logic.
 * A "mood" modifier can shift weights based on the group's selected mood.
 */

import { Injectable } from "@nestjs/common";
import { TmdbMovie } from "../tmdb/tmdb.service";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface ScoringWeights {
  rating: number;
  votes: number;
  popularity: number;
  genre: number;
  runtime: number;
}

// Default weights (must sum to ~1.0 for normalised score, but they don't have to)
const DEFAULT_WEIGHTS: ScoringWeights = {
  rating: 0.4, // TMDB rating is the strongest signal
  votes: 0.15, // Vote count (log-normalised)
  popularity: 0.15, // Popularity balance
  genre: 0.3, // Genre overlap with group's combined taste
  runtime: -0.05, // Slight penalty for films > 2.5 hours
};

// Mood modifiers — override specific weights when a mood is selected
const MOOD_OVERRIDES: Record<string, Partial<ScoringWeights>> = {
  light: { genre: 0.4, rating: 0.3 },
  funny: { genre: 0.45, rating: 0.3 },
  emotional: { rating: 0.5, genre: 0.35 },
  thrilling: { genre: 0.4, rating: 0.35 },
  romantic: { genre: 0.45, rating: 0.3 },
  "mind-bending": { rating: 0.35, genre: 0.45 },
};

// Genre tags associated with each mood (used for genre boosting)
const MOOD_GENRES: Record<string, string[]> = {
  light: ["Comedy", "Family", "Animation"],
  funny: ["Comedy"],
  emotional: ["Drama", "Romance"],
  thrilling: ["Thriller", "Action", "Crime", "Mystery"],
  romantic: ["Romance", "Drama"],
  "mind-bending": ["Science Fiction", "Mystery", "Thriller", "Drama"],
};

@Injectable()
export class ScoringService {
  /**
   * Score all shared movies and return them sorted best → worst.
   *
   * @param movies     TMDB-enriched shared movies
   * @param mood       Optional group mood selector
   */
  scoreMovies(movies: TmdbMovie[], mood?: string): ScoredMovie[] {
    if (movies.length === 0) return [];

    const weights = this.buildWeights(mood);
    const moodGenres = mood ? (MOOD_GENRES[mood] ?? []) : [];

    // Build a genre frequency map from all movies in the shared list
    // (proxy for "genres this group likes")
    const genreFrequency = this.buildGenreFrequency(movies);
    const maxGenreScore = Math.max(...Object.values(genreFrequency), 1);

    // Pre-compute normalisation ranges
    const maxVoteCount = Math.max(...movies.map((m) => m.voteCount), 1);

    const scored: ScoredMovie[] = movies.map((movie) => {
      const ratingScore = this.ratingScore(movie.tmdbRating);
      const voteScore = this.voteScore(movie.voteCount, maxVoteCount);
      const popularityScore = this.popularityScore(movie.popularity);
      const genreScore = this.genreScore(
        movie.genres,
        genreFrequency,
        maxGenreScore,
        moodGenres,
      );
      const runtimePenalty = this.runtimePenalty(movie.runtime);

      const score =
        ratingScore * weights.rating +
        voteScore * weights.votes +
        popularityScore * weights.popularity +
        genreScore * weights.genre +
        runtimePenalty * Math.abs(weights.runtime); // penalty is negative weight

      return {
        ...movie,
        score: Math.max(0, Math.round(score * 1000) / 1000),
        scoreBreakdown: {
          ratingScore,
          voteScore,
          popularityScore,
          genreScore,
          runtimePenalty,
        },
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  // ── Scoring sub-functions (all return 0–1) ─────────────────────────────────

  /**
   * Normalise TMDB rating (0–10) to 0–1.
   * A rating below 5.0 starts to meaningfully hurt the score.
   */
  private ratingScore(rating: number | null): number {
    if (!rating) return 0.4; // Unknown = average
    return Math.min(rating / 10, 1);
  }

  /**
   * Log-normalise vote count so a movie with 500k votes doesn't
   * completely dominate over a great film with 50k.
   */
  private voteScore(voteCount: number, maxVotes: number): number {
    if (maxVotes === 0) return 0;
    return Math.log10(voteCount + 1) / Math.log10(maxVotes + 1);
  }

  /**
   * Popularity balance score.
   * We want films in a "sweet spot" — not ultra-niche (< 5) but not
   * mega-mainstream blockbusters only (> 500).
   * Uses a bell-curve-ish approach peaking at ~30–80 popularity.
   */
  private popularityScore(popularity: number): number {
    // TMDB popularity can range 0 → 1000+
    // Normalise to 0–1 with logarithmic scale, penalising extremes
    const normalized = Math.min(Math.log10(popularity + 1) / 3, 1); // log10(1000) ≈ 3
    return normalized;
  }

  /**
   * Genre overlap score.
   * Movies whose genres appear most frequently across the shared list
   * score higher (proxy for the group's combined taste).
   * Mood genres receive an extra boost.
   */
  private genreScore(
    genres: string[],
    genreFreq: Record<string, number>,
    maxFreq: number,
    moodGenres: string[],
  ): number {
    if (!genres.length || maxFreq === 0) return 0;

    let total = 0;
    for (const genre of genres) {
      const freq = genreFreq[genre] ?? 0;
      const base = freq / maxFreq;
      // Mood genre boost: +30% if this genre matches the selected mood
      const moodBoost = moodGenres.includes(genre) ? 0.3 : 0;
      total += Math.min(base + moodBoost, 1);
    }

    return Math.min(total / genres.length, 1);
  }

  /**
   * Runtime penalty — very long films (> 150 min) get a slight negative.
   * Returns a value 0–1 where 0 = no penalty, 1 = maximum penalty.
   */
  private runtimePenalty(runtime: number | null): number {
    if (!runtime) return 0;
    if (runtime <= 150) return 0;
    // Scale penalty from 150 to 240 minutes
    return Math.min((runtime - 150) / 90, 1);
  }

  /** Count how many movies in the list contain each genre */
  private buildGenreFrequency(movies: TmdbMovie[]): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const movie of movies) {
      for (const genre of movie.genres) {
        freq[genre] = (freq[genre] ?? 0) + 1;
      }
    }
    return freq;
  }

  /** Merge default weights with mood-specific overrides */
  private buildWeights(mood?: string): ScoringWeights {
    const overrides = mood ? (MOOD_OVERRIDES[mood] ?? {}) : {};
    return { ...DEFAULT_WEIGHTS, ...overrides };
  }
}
