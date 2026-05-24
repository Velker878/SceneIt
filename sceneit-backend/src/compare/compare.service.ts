/**
 * CompareService
 *
 * The orchestrator for the full comparison flow:
 *
 *   1. Scrape watchlists for all usernames (in parallel, Redis-cached)
 *   2. Find movies present in ALL users' watchlists (intersection)
 *   3. Enrich shared movies with TMDB metadata (in parallel, Redis-cached)
 *   4. Score movies and pick the top recommendation
 *   5. Generate an AI explanation for the top pick
 *   6. Compute stats (shared genres, total count, etc.)
 *   7. Return the full comparison result
 */

import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import {
  LetterboxdService,
  LetterboxdFilm,
} from "../letterboxd/letterboxd.service";
import { TmdbService, TmdbMovie } from "../tmdb/tmdb.service";
import { ScoringService, ScoredMovie } from "./scoring.service";
import { AiRecommendationService } from "./ai-recommendation.service";
import { CompareDto } from "./dto/compare.dto";

// ── Response Types ─────────────────────────────────────────────────────────────

export interface CompareStats {
  /** Total number of movies shared across all users */
  sharedCount: number;
  /** Genres shared most across the combined watchlist */
  topSharedGenres: string[];
  /** Average TMDB rating of the shared movies */
  averageRating: number | null;
  /** Per-user watchlist sizes */
  watchlistSizes: Record<string, number>;
}

export interface CompareResult {
  usernames: string[];
  recommendedMovie: ScoredMovie & { aiExplanation: string };
  sharedMovies: TmdbMovie[]; // All shared movies, sorted by score (best first)
  stats: CompareStats;
}

@Injectable()
export class CompareService {
  private readonly logger = new Logger(CompareService.name);

  constructor(
    private readonly letterboxd: LetterboxdService,
    private readonly tmdb: TmdbService,
    private readonly scoring: ScoringService,
    private readonly ai: AiRecommendationService,
  ) {}

  async compare(dto: CompareDto): Promise<CompareResult> {
    const usernames = dto.usernames.map((u) => u.toLowerCase().trim());
    this.logger.log(`Comparing watchlists for: ${usernames.join(", ")}`);

    // ── Step 1: Scrape watchlists in parallel ───────────────────────────────
    // Each user's watchlist is scraped concurrently. Each individual scrape
    // is sequential across pages (to be polite), but multiple users' scrapes
    // run at the same time.
    const watchlistResults = await Promise.all(
      usernames.map((username) =>
        this.letterboxd
          .scrapeWatchlist(username)
          .then((films) => ({ username, films }))
          .catch((err) => {
            this.logger.error(`Failed to scrape ${username}: ${err.message}`);
            return { username, films: [] as LetterboxdFilm[] };
          }),
      ),
    );

    // Track watchlist sizes for stats
    const watchlistSizes: Record<string, number> = {};
    for (const { username, films } of watchlistResults) {
      watchlistSizes[username] = films.length;
    }

    // ── Step 2: Find intersection (movies in ALL watchlists) ────────────────
    const sharedFilms = this.intersectWatchlists(
      watchlistResults.map((r) => r.films),
    );

    this.logger.log(
      `Found ${sharedFilms.length} shared films across ${usernames.length} users`,
    );

    if (sharedFilms.length === 0) {
      throw new BadRequestException(
        "No movies found in common across all provided watchlists. " +
          "Try comparing fewer users or check that their watchlists are not empty.",
      );
    }

    // ── Step 3: Enrich with TMDB ────────────────────────────────────────────
    const enrichedMovies = await this.tmdb.enrichFilms(sharedFilms);

    if (enrichedMovies.length === 0) {
      throw new BadRequestException(
        "Could not find any of the shared movies on TMDB. This is unexpected — please try again.",
      );
    }

    // ── Step 4: Score and rank ──────────────────────────────────────────────
    const scoredMovies = this.scoring.scoreMovies(enrichedMovies, dto.mood);
    const topPick = scoredMovies[0];

    // ── Step 5: Generate AI explanation ────────────────────────────────────
    const aiExplanation = await this.ai.generateRecommendation(
      topPick,
      enrichedMovies,
      usernames,
      dto.mood,
    );

    // ── Step 6: Build stats ─────────────────────────────────────────────────
    const stats = this.buildStats(enrichedMovies, watchlistSizes);

    // ── Step 7: Return result ───────────────────────────────────────────────
    return {
      usernames,
      recommendedMovie: { ...topPick, aiExplanation },
      // Return ALL shared movies sorted best-first (top pick is always first)
      sharedMovies: scoredMovies,
      stats,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Find films present in ALL user watchlists.
   *
   * Matching key: normalised title + year
   *   "the dark knight" + 2008
   *
   * We use the Letterboxd slug as the primary key when available since it's
   * already unique and normalised by Letterboxd (e.g. "the-dark-knight-2008").
   * Slug comparison is far more reliable than fuzzy title matching.
   */
  private intersectWatchlists(
    watchlists: LetterboxdFilm[][],
  ): LetterboxdFilm[] {
    if (watchlists.length === 0) return [];
    if (watchlists.length === 1) return watchlists[0];

    // Build a slug set for each user
    const slugSets = watchlists.map(
      (films) => new Set(films.map((f) => f.slug)),
    );

    // A film is "shared" if its slug is present in every user's set
    const [firstUserFilms, ...rest] = watchlists;

    return firstUserFilms.filter((film) =>
      rest.every((_, i) => slugSets[i + 1].has(film.slug)),
    );
  }

  /** Compute comparison statistics */
  private buildStats(
    movies: TmdbMovie[],
    watchlistSizes: Record<string, number>,
  ): CompareStats {
    // Genre frequency across all shared movies
    const genreFreq: Record<string, number> = {};
    for (const movie of movies) {
      for (const genre of movie.genres) {
        genreFreq[genre] = (genreFreq[genre] ?? 0) + 1;
      }
    }

    const topSharedGenres = Object.entries(genreFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    // Average rating of shared movies
    const ratedMovies = movies.filter((m) => m.tmdbRating !== null);
    const averageRating =
      ratedMovies.length > 0
        ? Math.round(
            (ratedMovies.reduce((sum, m) => sum + m.tmdbRating!, 0) /
              ratedMovies.length) *
              10,
          ) / 10
        : null;

    return {
      sharedCount: movies.length,
      topSharedGenres,
      averageRating,
      watchlistSizes,
    };
  }
}
