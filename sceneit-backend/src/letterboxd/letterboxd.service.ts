/**
 * LetterboxdService
 *
 * Responsible for all interactions with Letterboxd's public HTML:
 *   - Validating that a username exists and has a public watchlist
 *   - Fetching the user's profile picture from their profile page
 *   - Scraping all pages of a user's watchlist
 *
 * This is a direct TypeScript port of the provided Python scraper.
 * HTML selectors are kept in one place (SELECTORS constant) so they
 * are easy to update if Letterboxd changes their markup.
 *
 * Caching: watchlist results are stored in Redis with a configurable TTL
 * so repeat comparisons don't re-scrape unnecessarily.
 */

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import { getErrorMessage, getErrorCode } from "../common/utils/error.utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LetterboxdFilm {
  /** Letterboxd slug, e.g. "the-dark-knight-2008" — used to build the movie URL */
  slug: string;
  /** Clean title without the year, e.g. "The Dark Knight" */
  title: string;
  /** 4-digit release year parsed from display name, or null if unparseable */
  year: number | null;
  /** Full Letterboxd URL for this film */
  letterboxdUrl: string;
}

export interface LetterboxdUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type ValidationStatus = "valid" | "not_found" | "private" | "error";

export interface ValidationResult {
  username: string;
  status: ValidationStatus;
  /** Populated only when status === 'valid' */
  user?: LetterboxdUser;
  /** Human-readable reason when status !== 'valid' */
  reason?: string;
}

// ── HTML Selectors ────────────────────────────────────────────────────────────
// Centralised here so a markup change only needs one fix.

const SELECTORS = {
  /**
   * The <ul> that wraps all film poster <li> elements on a watchlist page.
   * Class "-p125" is Letterboxd's internal utility class for the watchlist grid.
   */
  watchlistGrid: "ul.-p125",

  /**
   * Each <li> inside the grid contains a <div> with data attributes:
   *   data-item-slug            → "the-dark-knight-2008"
   *   data-item-full-display-name → "The Dark Knight (2008)"
   */
  filmItem: "li",
  filmDiv: "div[data-item-slug]",

  /**
   * Profile page: the avatar image lives inside a div.profile-avatar
   */
  profileAvatarDiv: "div.profile-avatar",
  profileAvatarImg: "img",

  /**
   * Display name on profile page
   */
  displayName: "h1.title-1",
} as const;

const BASE_URL = "https://letterboxd.com";

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class LetterboxdService {
  private readonly logger = new Logger(LetterboxdService.name);
  private readonly http: AxiosInstance;
  private readonly scrapeDelayMs: number;
  private readonly watchlistCacheTtl: number; // seconds

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.scrapeDelayMs = this.config.get<number>("SCRAPE_DELAY_MS", 800);
    this.watchlistCacheTtl = this.config.get<number>(
      "WATCHLIST_CACHE_TTL",
      28800, // 8 hours default
    );

    // Shared Axios instance with a realistic browser User-Agent.
    // We set allow_redirects: false equivalent via maxRedirects: 0 only
    // during validation so we can detect 301/302 (private watchlists).
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 12000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Validate a single Letterboxd username.
   *
   * Sends a HEAD-style GET (no redirect following) to /{username}/watchlist/.
   * Status codes mirror your Python implementation:
   *   200  → valid, public watchlist
   *   404  → user not found
   *   302  → redirect usually means "login required" = private/inaccessible
   *   403  → explicitly private
   *
   * On success, also fetches the user's profile picture.
   */
  async validateUser(username: string): Promise<ValidationResult> {
    const url = `/${username}/watchlist/`;

    try {
      const response = await this.http.get(url, {
        maxRedirects: 0, // Don't follow redirects — detect them as private
        validateStatus: (s) => s < 500, // Don't throw on 4xx; we handle them below
      });

      const status = response.status;

      if (status === 200) {
        // Valid user with a public watchlist — fetch their profile data
        const user = await this.fetchUserProfile(username);
        return { username, status: "valid", user };
      }

      if (status === 404) {
        return {
          username,
          status: "not_found",
          reason: "User not found on Letterboxd",
        };
      }

      if (status === 302 || status === 301) {
        // Letterboxd redirects to login for private/restricted watchlists
        return {
          username,
          status: "private",
          reason: "Watchlist is private or inaccessible",
        };
      }

      if (status === 403) {
        return {
          username,
          status: "private",
          reason: "Watchlist is not public",
        };
      }

      return { username, status: "error", reason: `Unexpected HTTP ${status}` };
    } catch (err) {
      if (getErrorCode(err) === "ECONNABORTED") {
        return { username, status: "error", reason: "Request timed out" };
      }
      this.logger.warn(
        `Validation error for "${username}": ${getErrorMessage(err)}`,
      );
      return { username, status: "error", reason: "Network error" };
    }
  }

  /**
   * Scrape the full watchlist for a validated user.
   *
   * Results are cached in Redis under "watchlist:{username}" to avoid
   * re-scraping on repeat comparisons within the cache window.
   *
   * Pagination: iterates /{username}/watchlist/page/{n}/ until a page
   * returns a non-200 status or an empty film grid.
   */
  async scrapeWatchlist(username: string): Promise<LetterboxdFilm[]> {
    const cacheKey = `watchlist:${username}`;

    // ── Cache hit ──────────────────────────────────────────────────────────
    const cached = await this.cache.get<LetterboxdFilm[]>(cacheKey);
    if (cached) {
      this.logger.log(
        `Cache hit for watchlist:${username} (${cached.length} films)`,
      );
      return cached;
    }

    // ── Scrape ────────────────────────────────────────────────────────────
    this.logger.log(`Scraping watchlist for: ${username}`);
    const films: LetterboxdFilm[] = [];
    let page = 1;

    while (true) {
      const pageUrl =
        page === 1
          ? `/${username}/watchlist/`
          : `/${username}/watchlist/page/${page}/`;

      let html: string;
      try {
        const response = await this.http.get(pageUrl, {
          validateStatus: (s) => s === 200,
        });
        html = response.data;
      } catch {
        // Non-200 means we've gone past the last page — stop
        break;
      }

      const pageFilms = this.parseWatchlistPage(html, username);

      if (pageFilms.length === 0) {
        break; // Empty page = end of watchlist
      }

      films.push(...pageFilms);
      this.logger.debug(
        `  Page ${page}: ${pageFilms.length} films (total: ${films.length})`,
      );
      page++;

      // Polite delay between page requests — mirrors your Python time.sleep(1)
      await this.delay(this.scrapeDelayMs);
    }

    this.logger.log(`Scraped ${films.length} films for ${username}`);

    // ── Cache store ───────────────────────────────────────────────────────
    await this.cache.set(cacheKey, films, this.watchlistCacheTtl * 1000);

    return films;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Parse one watchlist page's HTML into an array of LetterboxdFilm objects.
   *
   * The structure we're targeting (from your Python):
   *   <ul class="-p125">
   *     <li>
   *       <div data-item-slug="the-dark-knight-2008"
   *            data-item-full-display-name="The Dark Knight (2008)">
   *       </div>
   *     </li>
   *   </ul>
   */
  private parseWatchlistPage(html: string, username: string): LetterboxdFilm[] {
    const $ = cheerio.load(html);
    const films: LetterboxdFilm[] = [];

    const grid = $(SELECTORS.watchlistGrid);
    if (!grid.length) {
      return films; // No grid found — page may be empty or layout changed
    }

    grid.find(SELECTORS.filmItem).each((_, li) => {
      const div = $(li).find(SELECTORS.filmDiv).first();
      if (!div.length) return;

      const slug = div.attr("data-item-slug");
      if (!slug) return;

      const rawDisplayName = div.attr("data-item-full-display-name") ?? "";
      const { title, year } = this.parseDisplayName(rawDisplayName);

      films.push({
        slug,
        title,
        year,
        letterboxdUrl: `${BASE_URL}/film/${slug}/`,
      });
    });

    return films;
  }

  /**
   * Parse "The Dark Knight (2008)" → { title: "The Dark Knight", year: 2008 }
   * Mirrors your Python regex: r'\((\d{4})\)\s*$'
   */
  private parseDisplayName(raw: string): {
    title: string;
    year: number | null;
  } {
    const match = raw.match(/\((\d{4})\)\s*$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const title = raw.slice(0, match.index).trim();
      return { title, year };
    }
    return { title: raw.trim(), year: null };
  }

  /**
   * Fetch a user's public profile page to extract:
   *  - Display name (h1.title-1)
   *  - Profile picture (div.profile-avatar img[src])
   *
   * Mirrors your Python fetch_user_pfp() function.
   */
  private async fetchUserProfile(username: string): Promise<LetterboxdUser> {
    try {
      const response = await this.http.get(`/${username}/`, {
        validateStatus: (s) => s === 200,
      });

      const $ = cheerio.load(response.data);

      // ── Avatar ──────────────────────────────────────────────────────────
      // <div class="profile-avatar"><img src="https://..."/></div>
      const avatarImg = $(SELECTORS.profileAvatarDiv)
        .find(SELECTORS.profileAvatarImg)
        .first();
      const avatarUrl = avatarImg.attr("src") ?? null;

      // ── Display name ────────────────────────────────────────────────────
      const displayName =
        $(SELECTORS.displayName).first().text().trim() || null;

      return { username, displayName, avatarUrl };
    } catch (err) {
      this.logger.warn(
        `Could not fetch profile for ${username}: ${getErrorMessage(err)}`,
      );
      // Non-fatal — return partial data; avatar/displayName will be null
      return { username, displayName: null, avatarUrl: null };
    }
  }

  /** Promisified delay — replaces Python's time.sleep() */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
