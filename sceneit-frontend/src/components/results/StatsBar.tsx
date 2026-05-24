"use client";

import { Film, Star, Tag } from "lucide-react";
import type { CompareResult } from "@/types";
import { formatRating } from "@/lib/utils";

interface Props {
  result: CompareResult;
}

export function StatsBar({ result }: Props) {
  const { stats, usernames } = result;

  const userLabel =
    usernames.length === 2
      ? `${usernames[0]} & ${usernames[1]}`
      : usernames.join(", ");

  return (
    <div className="bg-scene-surface border border-scene-border rounded-2xl px-6 py-4">
      <p className="text-scene-text-muted text-sm mb-4">
        <span className="text-scene-text font-semibold">{userLabel}</span> have{" "}
        <span className="text-scene-amber font-semibold">
          {stats.sharedCount} {stats.sharedCount === 1 ? "movie" : "movies"}
        </span>{" "}
        in common
      </p>

      <div className="flex flex-wrap gap-4 text-xs">
        {/* Shared genres */}
        {stats.topSharedGenres.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-scene-amber flex-shrink-0" />
            <span className="text-scene-text-dim">Top genres:</span>
            <span className="text-scene-text">
              {stats.topSharedGenres.slice(0, 3).join(" · ")}
            </span>
          </div>
        )}

        {/* Average rating */}
        {stats.averageRating && (
          <div className="flex items-center gap-2">
            <Star size={12} className="text-scene-amber flex-shrink-0" />
            <span className="text-scene-text-dim">Avg. rating:</span>
            <span className="text-scene-text">
              {formatRating(stats.averageRating)}
            </span>
          </div>
        )}

        {/* Watchlist sizes */}
        <div className="flex items-center gap-2">
          <Film size={12} className="text-scene-amber flex-shrink-0" />
          <span className="text-scene-text-dim">Watchlist sizes:</span>
          <span className="text-scene-text">
            {Object.entries(stats.watchlistSizes)
              .map(([u, count]) => `${u} (${count})`)
              .join(" · ")}
          </span>
        </div>
      </div>
    </div>
  );
}
