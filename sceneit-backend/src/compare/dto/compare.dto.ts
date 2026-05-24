import {
  IsArray,
  IsString,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
} from "class-validator";

export class CompareDto {
  /**
   * 2–8 validated Letterboxd usernames to compare.
   * The frontend is responsible for validating them first via /letterboxd/validate.
   */
  @IsArray()
  @ArrayMinSize(2, {
    message: "You need at least 2 users to compare watchlists",
  })
  @ArrayMaxSize(8, { message: "Maximum 8 users per comparison" })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  usernames: string[];

  /**
   * Optional mood filter that shifts the scoring algorithm weights.
   * Frontend can surface this as a "Group Mood" selector.
   */
  @IsOptional()
  @IsIn([
    "any",
    "light",
    "mind-bending",
    "emotional",
    "funny",
    "thrilling",
    "romantic",
  ])
  mood?: string;
}
