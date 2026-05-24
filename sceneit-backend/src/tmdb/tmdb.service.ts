/**
 * TmdbService
 *
 * Responsible for all TMDB API interactions:
 *   - Searching for a movie by title + year to get its TMDB ID
 *   - Fetching full movie details (genres, runtime, cast, director, etc.)
 *   - Building image URLs using TMDB's image CDN
 *
 * Results are cached in Redis so repeated comparisons don't re-hit the API.
 */

import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import axios, { AxiosInstance } from "axios";
import { LetterboxdFilm } from "../letterboxd/letterboxd.service";
import { getErrorMessage } from "../common/utils/error.utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  year: number | null;
  overview: string;
  tagline: string;
  /** Full URL, e.g. https://image.tmdb.org/t/p/w500/abc123.jpg */
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  runtime: number | null; // minutes
  tmdbRating: number | null; // 0–10
  voteCount: number;
  popularity: number;
  releaseDate: string | null;
  director: string | null;
  topCast: string[]; // top 5 cast names
  trailerKey: string | null; // YouTube key for the official trailer
  letterboxdUrl: string; // passed through from the Letterboxd film
  letterboxdSlug: string;
}

// Poster sizes available on TMDB image CDN
type PosterSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "original";
type BackdropSize = "w300" | "w780" | "w1280" | "original";

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly http: AxiosInstance;
  private readonly imageBase: string;
  private readonly cacheTtl: number; // seconds

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    const apiKey = this.config.getOrThrow<string>("TMDB_API_KEY");
    const baseUrl = this.config.get<string>(
      "TMDB_BASE_URL",
      "https://api.themoviedb.org/3",
    );
    this.imageBase = this.config.get<string>(
      "TMDB_IMAGE_BASE_URL",
      "https://image.tmdb.org/t/p",
    );
    this.cacheTtl = this.config.get<number>("TMDB_CACHE_TTL", 86400); // 24h default

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      params: { api_key: apiKey }, // Appended to every request automatically
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Enrich a Letterboxd film with full TMDB metadata.
   *
   * Steps:
   *   1. Check Redis cache
   *   2. Search TMDB by title + year
   *   3. Fetch detailed movie data (for runtime, imdb_id, etc.)
   *   4. Fetch credits (director, cast)
   *   5. Fetch videos (trailer)
   *   6. Store in cache and return
   *
   * Returns null if the movie cannot be found on TMDB.
   */
  async enrichFilm(film: LetterboxdFilm): Promise<TmdbMovie | null> {
    const cacheKey = `tmdb:${film.slug}`;

    // ── Cache hit ──────────────────────────────────────────────────────────
    const cached = await this.cache.get<TmdbMovie>(cacheKey);
    if (cached) return cached;

    // ── Search ─────────────────────────────────────────────────────────────
    const tmdbId = await this.searchMovie(film.title, film.year);
    if (!tmdbId) {
      this.logger.warn(`TMDB: No match for "${film.title}" (${film.year})`);
      return null;
    }

    // ── Detail fetch (parallel) ────────────────────────────────────────────
    const [details, credits, videos] = await Promise.all([
      this.fetchDetails(tmdbId),
      this.fetchCredits(tmdbId),
      this.fetchVideos(tmdbId),
    ]);

    if (!details) return null;

    // ── Build enriched movie object ────────────────────────────────────────
    const movie: TmdbMovie = {
      tmdbId,
      imdbId: details.imdb_id ?? null,
      title: details.title,
      originalTitle: details.original_title,
      year: details.release_date
        ? parseInt(details.release_date.slice(0, 4), 10)
        : film.year,
      overview: details.overview ?? "",
      tagline: details.tagline ?? "",
      posterUrl: this.buildImageUrl(details.poster_path, "w500"),
      backdropUrl: this.buildImageUrl(
        details.backdrop_path,
        "w1280",
        "backdrop",
      ),
      genres: (details.genres ?? []).map((g: any) => g.name),
      runtime: details.runtime ?? null,
      tmdbRating: details.vote_average
        ? Math.round(details.vote_average * 10) / 10
        : null,
      voteCount: details.vote_count ?? 0,
      popularity: details.popularity ?? 0,
      releaseDate: details.release_date ?? null,
      director: this.extractDirector(credits),
      topCast: this.extractCast(credits, 5),
      trailerKey: this.extractTrailerKey(videos),
      letterboxdUrl: film.letterboxdUrl,
      letterboxdSlug: film.slug,
    };

    // ── Cache store ────────────────────────────────────────────────────────
    await this.cache.set(cacheKey, movie, this.cacheTtl * 1000);

    return movie;
  }

  /**
   * Enrich an array of Letterboxd films concurrently.
   * Uses a small concurrency limit to avoid hammering the TMDB rate limit
   * (40 requests per 10 seconds on free tier).
   */
  async enrichFilms(
    films: LetterboxdFilm[],
    concurrency = 8,
  ): Promise<TmdbMovie[]> {
    const results: TmdbMovie[] = [];
    const pLimit = await this.getPLimit(concurrency);

    const tasks = films.map((film) =>
      pLimit(async () => {
        const enriched = await this.enrichFilm(film);
        return enriched;
      }),
    );

    const settled = await Promise.all(tasks);
    for (const movie of settled) {
      if (movie) results.push(movie);
    }

    return results;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Search TMDB for a movie by title and optional year.
   * Returns the TMDB ID of the best match, or null if not found.
   *
   * Strategy:
   *   1. Search with title + year (most precise)
   *   2. If no results, retry with title only (catches year mismatches)
   */
  private async searchMovie(
    title: string,
    year: number | null,
  ): Promise<number | null> {
    try {
      const params: Record<string, any> = {
        query: title,
        include_adult: false,
      };
      if (year) params.year = year;

      const response = await this.http.get("/search/movie", { params });
      const results = response.data?.results ?? [];

      if (results.length > 0) {
        return results[0].id;
      }

      // Retry without year constraint
      if (year) {
        const fallback = await this.http.get("/search/movie", {
          params: { query: title, include_adult: false },
        });
        const fallbackResults = fallback.data?.results ?? [];
        if (fallbackResults.length > 0) {
          return fallbackResults[0].id;
        }
      }

      return null;
    } catch (err) {
      this.logger.warn(
        `TMDB search failed for "${title}": ${getErrorMessage(err)}`,
      );
      return null;
    }
  }

  /** GET /movie/{id} — full details including runtime and imdb_id */
  private async fetchDetails(tmdbId: number): Promise<any | null> {
    try {
      const response = await this.http.get(`/movie/${tmdbId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** GET /movie/{id}/credits — cast and crew */
  private async fetchCredits(tmdbId: number): Promise<any | null> {
    try {
      const response = await this.http.get(`/movie/${tmdbId}/credits`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** GET /movie/{id}/videos — trailers, teasers, etc. */
  private async fetchVideos(tmdbId: number): Promise<any | null> {
    try {
      const response = await this.http.get(`/movie/${tmdbId}/videos`);
      return response.data;
    } catch {
      return null;
    }
  }

  /** Extract the director's name from the credits response */
  private extractDirector(credits: any): string | null {
    if (!credits?.crew) return null;
    const director = credits.crew.find((c: any) => c.job === "Director");
    return director?.name ?? null;
  }

  /** Extract top N cast member names from credits response */
  private extractCast(credits: any, limit: number): string[] {
    if (!credits?.cast) return [];
    return credits.cast.slice(0, limit).map((c: any) => c.name);
  }

  /**
   * Extract the YouTube key for the official trailer.
   * Prefers "Official Trailer" in the name; falls back to any Trailer type.
   */
  private extractTrailerKey(videos: any): string | null {
    if (!videos?.results?.length) return null;

    const allTrailers = videos.results.filter(
      (v: any) => v.type === "Trailer" && v.site === "YouTube",
    );

    if (!allTrailers.length) return null;

    const official = allTrailers.find((v: any) =>
      v.name?.toLowerCase().includes("official"),
    );

    return (official ?? allTrailers[0]).key;
  }

  /**
   * Build a full TMDB image URL.
   * @param path   e.g. "/abc123.jpg" from TMDB response
   * @param size   poster or backdrop size string
   * @param type   'poster' | 'backdrop' (for type-safe size selection)
   */
  private buildImageUrl(
    path: string | null | undefined,
    size: PosterSize | BackdropSize,
    type: "poster" | "backdrop" = "poster",
  ): string | null {
    if (!path) return null;
    return `${this.imageBase}/${size}${path}`;
  }

  /**
   * Dynamically import p-limit (ESM-only package).
   * Returns a concurrency limiter function.
   */
  private async getPLimit(concurrency: number) {
    const { default: pLimit } = await import("p-limit");
    return pLimit(concurrency);
  }
}
