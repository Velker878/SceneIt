import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { CompareService } from "./compare.service";
import { CompareDto } from "./dto/compare.dto";

/**
 * CompareController
 *
 * Routes:
 *   POST /api/compare  → full watchlist comparison + recommendation
 *
 * This is the primary endpoint the frontend calls after all usernames
 * have been validated. It may take 5–15 seconds on first run (no cache),
 * but subsequent calls for the same users will be much faster.
 *
 * The frontend should show a loading/progress state while this runs.
 */
@Controller("compare")
export class CompareController {
  private readonly logger = new Logger(CompareController.name);

  constructor(private readonly compareService: CompareService) {}

  /**
   * POST /api/compare
   *
   * Request body:
   * {
   *   "usernames": ["alice", "bob"],           // 2–8 validated Letterboxd usernames
   *   "mood": "thrilling"                      // optional mood filter
   * }
   *
   * Response:
   * {
   *   "usernames": ["alice", "bob"],
   *   "recommendedMovie": {
   *     ...TmdbMovie fields...,
   *     "score": 0.847,
   *     "scoreBreakdown": { ... },
   *     "aiExplanation": "Since both of you have..."
   *   },
   *   "sharedMovies": [ ...all shared movies sorted by score... ],
   *   "stats": {
   *     "sharedCount": 23,
   *     "topSharedGenres": ["Drama", "Thriller"],
   *     "averageRating": 7.4,
   *     "watchlistSizes": { "alice": 312, "bob": 187 }
   *   }
   * }
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async compare(@Body() dto: CompareDto) {
    this.logger.log(`Compare request for: ${dto.usernames.join(", ")}`);
    const result = await this.compareService.compare(dto);
    return result;
  }
}
