import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { LetterboxdService } from "./letterboxd.service";
import { ValidateUserDto, ValidateManyUsersDto } from "./dto/validate-user.dto";

/**
 * LetterboxdController
 *
 * Routes:
 *   POST /api/letterboxd/validate       → validate a single username
 *   POST /api/letterboxd/validate-many  → validate multiple usernames at once
 *
 * The scrapeWatchlist() method is NOT exposed as a standalone route here
 * because watchlist fetching is always triggered through the compare flow
 * (see CompareController). Exposing it separately would allow abuse.
 */
@Controller("letterboxd")
export class LetterboxdController {
  constructor(private readonly letterboxdService: LetterboxdService) {}

  /**
   * POST /api/letterboxd/validate
   *
   * Called by the frontend on each username the user types in (debounced).
   * Returns whether the user exists, has a public watchlist, and their avatar.
   *
   * Response shape:
   * {
   *   username: "zach",
   *   status: "valid" | "not_found" | "private" | "error",
   *   user?: { username, displayName, avatarUrl },
   *   reason?: "..."
   * }
   */
  @Post("validate")
  @HttpCode(HttpStatus.OK)
  async validateUser(@Body() dto: ValidateUserDto) {
    const result = await this.letterboxdService.validateUser(
      dto.username.toLowerCase().trim(),
    );
    return result;
  }

  /**
   * POST /api/letterboxd/validate-many
   *
   * Validate an array of usernames. Runs them sequentially (not in parallel)
   * to be respectful to Letterboxd's servers.
   *
   * Request body: { "usernames": ["alice", "bob", "charlie"] }
   *
   * Response: array of validation results in the same order as input.
   */
  @Post("validate-many")
  @HttpCode(HttpStatus.OK)
  async validateMany(@Body() dto: ValidateManyUsersDto) {
    if (!Array.isArray(dto.usernames) || dto.usernames.length === 0) {
      throw new BadRequestException("Provide at least one username");
    }

    if (dto.usernames.length > 8) {
      throw new BadRequestException("Maximum 8 users per comparison");
    }

    const sanitized = dto.usernames.map((u) => u.toLowerCase().trim());

    // Validate sequentially — parallel would hammer Letterboxd
    const results = [];
    for (const username of sanitized) {
      const result = await this.letterboxdService.validateUser(username);
      results.push(result);
    }

    return results;
  }
}
