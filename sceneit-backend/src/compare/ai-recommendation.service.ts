/**
 * AiRecommendationService
 *
 * Uses OpenAI to generate a cinematic, personalised recommendation blurb
 * explaining WHY this movie is perfect for this specific group.
 *
 * The prompt is carefully engineered to:
 *   - Sound like a film-savvy friend, not a chatbot
 *   - Reference the group's actual shared tastes (genres, cast, director)
 *   - Be concise (2–3 paragraphs)
 *   - Avoid generic AI phrasing ("certainly!", "as an AI...")
 */

import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import OpenAI from "openai";
import { TmdbMovie } from "../tmdb/tmdb.service";
import { ScoredMovie } from "./scoring.service";
import { getErrorMessage } from "../common/utils/error.utils";

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>("OPENAI_API_KEY"),
    });
  }

  /**
   * Generate an AI recommendation blurb for the top-scored movie.
   *
   * @param movie       The recommended movie (top-scored, TMDB-enriched)
   * @param allShared   All shared movies (used to infer group taste)
   * @param usernames   The group's Letterboxd usernames
   * @param mood        Optional mood selected by the group
   *
   * Returns the blurb as a plain string (2–3 paragraphs, no markdown).
   */
  async generateRecommendation(
    movie: ScoredMovie,
    allShared: TmdbMovie[],
    usernames: string[],
    mood?: string,
  ): Promise<string> {
    const cacheKey = `ai:rec:${movie.letterboxdSlug}:${usernames.sort().join(",")}:${mood ?? "any"}`;

    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const prompt = this.buildPrompt(movie, allShared, usernames, mood);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast + cheap; switch to gpt-4o for higher quality
        messages: [
          {
            role: "system",
            content:
              "You are a witty, film-literate friend who gives movie recommendations. " +
              "Your tone is warm, conversational, and enthusiastic — like a Letterboxd power user. " +
              'Never use filler phrases like "certainly!", "great choice!", or "as an AI". ' +
              "Speak directly and confidently. Reference specific details about the film and the group's taste.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 350,
        temperature: 0.75,
      });

      const text =
        completion.choices[0]?.message?.content?.trim() ??
        this.fallbackRecommendation(movie);

      // Cache for 24 hours — this specific movie+group combo is unlikely to change
      await this.cache.set(cacheKey, text, 86400 * 1000);

      return text;
    } catch (err) {
      this.logger.error(`OpenAI error: ${getErrorMessage(err)}`);
      return this.fallbackRecommendation(movie);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Build the user-facing prompt sent to GPT.
   * Provides rich context so the model can make specific, non-generic claims.
   */
  private buildPrompt(
    movie: ScoredMovie,
    allShared: TmdbMovie[],
    usernames: string[],
    mood?: string,
  ): string {
    // Derive the group's top genres from the full shared list
    const genreFreq: Record<string, number> = {};
    for (const m of allShared) {
      for (const g of m.genres) {
        genreFreq[g] = (genreFreq[g] ?? 0) + 1;
      }
    }
    const topGenres = Object.entries(genreFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([g]) => g);

    const groupLabel =
      usernames.length === 2
        ? `${usernames[0]} and ${usernames[1]}`
        : `${usernames.slice(0, -1).join(", ")}, and ${usernames[usernames.length - 1]}`;

    const castInfo =
      movie.topCast.length > 0
        ? `Starring: ${movie.topCast.slice(0, 3).join(", ")}.`
        : "";

    const directorInfo = movie.director ? `Directed by ${movie.director}.` : "";

    const moodLine =
      mood && mood !== "any"
        ? `The group is in the mood for something "${mood}".`
        : "";

    return `
You are recommending a movie for a group of friends using an app called SceneIt.

Group: ${groupLabel}
Their shared watchlist has ${allShared.length} movies in common.
Their top genres across the shared watchlist: ${topGenres.join(", ")}.
${moodLine}

The top recommended movie is:
- Title: ${movie.title} (${movie.year})
- Genres: ${movie.genres.join(", ")}
- Runtime: ${movie.runtime ? `${movie.runtime} minutes` : "unknown"}
- TMDB Rating: ${movie.tmdbRating ?? "N/A"}/10
- Overview: ${movie.overview}
- ${directorInfo}
- ${castInfo}

Write a recommendation for why this movie is the perfect pick for ${groupLabel} tonight.
Keep it to 2–3 short paragraphs. Be specific — mention the film's actual qualities, 
the group's shared tastes, and what makes tonight the right night for it.
No markdown. No bullet points. Just compelling prose.
    `.trim();
  }

  /** Fallback if OpenAI is unavailable — a minimal non-AI string */
  private fallbackRecommendation(movie: TmdbMovie): string {
    const genres = movie.genres.slice(0, 2).join(" and ") || "cinema";
    return (
      `${movie.title} is the standout pick from your shared watchlist. ` +
      `A ${genres} film rated ${movie.tmdbRating ?? "?"}/10 on TMDB, ` +
      `it's been on everyone's list for a reason. Tonight's the night.`
    );
  }
}
