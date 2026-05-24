import { Module } from "@nestjs/common";
import { CompareController } from "./compare.controller";
import { CompareService } from "./compare.service";
import { ScoringService } from "./scoring.service";
import { AiRecommendationService } from "./ai-recommendation.service";
import { LetterboxdModule } from "../letterboxd/letterboxd.module";
import { TmdbModule } from "../tmdb/tmdb.module";

@Module({
  imports: [LetterboxdModule, TmdbModule],
  controllers: [CompareController],
  providers: [CompareService, ScoringService, AiRecommendationService],
})
export class CompareModule {}
