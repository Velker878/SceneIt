import { Module } from "@nestjs/common";
import { LetterboxdService } from "./letterboxd.service";
import { LetterboxdController } from "./letterboxd.controller";

@Module({
  controllers: [LetterboxdController],
  providers: [LetterboxdService],
  exports: [LetterboxdService], // CompareModule needs this
})
export class LetterboxdModule {}
