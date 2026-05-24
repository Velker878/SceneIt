import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";

import { LetterboxdModule } from "./letterboxd/letterboxd.module";
import { TmdbModule } from "./tmdb/tmdb.module";
import { CompareModule } from "./compare/compare.module";

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────────
    // Makes process.env values available via ConfigService everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // ── Redis Cache ───────────────────────────────────────────────────────
    // Registered globally so any service can inject CACHE_MANAGER
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          url: config.get<string>("REDIS_URL", "redis://localhost:6379"),
          ttl: 0, // Per-operation TTL; we set it explicitly on each call
        }),
      }),
    }),

    // ── Feature Modules ───────────────────────────────────────────────────
    LetterboxdModule,
    TmdbModule,
    CompareModule,
  ],
})
export class AppModule {}
