import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

/**
 * Body for POST /api/letterboxd/validate
 * Validates that the username is a plausible Letterboxd handle before
 * we even make a network request.
 */
export class ValidateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  // Letterboxd usernames: letters, numbers, hyphens, underscores only
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Username may only contain letters, numbers, hyphens and underscores",
  })
  username: string;
}

/**
 * Body for POST /api/letterboxd/validate-many
 * Used when the frontend wants to validate all entered usernames in one call.
 */
export class ValidateManyUsersDto {
  usernames: string[];
}
