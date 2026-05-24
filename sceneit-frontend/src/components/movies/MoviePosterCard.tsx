"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import type { ScoredMovie } from "@/types";

interface Props {
  movie: ScoredMovie;
  isRecommended?: boolean;
}

export function MoviePosterCard({ movie, isRecommended = false }: Props) {
  return (
    <a
      href={movie.letterboxdUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative poster-ratio rounded-lg overflow-hidden bg-scene-elevated border border-scene-border cursor-pointer"
      title={`${movie.title} (${movie.year})`}
    >
      {/* Poster image */}
      {movie.posterUrl ? (
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-scene-elevated">
          <span className="font-mono text-xs text-scene-text-dim text-center px-2 leading-tight">
            {movie.title}
          </span>
        </div>
      )}

      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-2 left-2 z-20 px-1.5 py-0.5 rounded bg-scene-amber text-scene-bg text-[10px] font-mono font-semibold tracking-wide">
          PICK
        </div>
      )}

      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 z-10",
          "bg-gradient-to-t from-black/90 via-black/40 to-transparent",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-250",
          "flex flex-col justify-end p-2.5",
        )}
      >
        <p className="text-white text-xs font-body font-semibold leading-tight line-clamp-2">
          {movie.title}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/60 text-[10px] font-mono">
            {movie.year ?? "—"}
          </span>
          {movie.tmdbRating && (
            <span className="flex items-center gap-0.5 text-scene-amber text-[10px] font-mono">
              <Star size={8} fill="currentColor" />
              {formatRating(movie.tmdbRating)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
