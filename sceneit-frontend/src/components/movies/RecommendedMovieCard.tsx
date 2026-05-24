"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Clock, ExternalLink, Sparkles } from "lucide-react";
import type { RecommendedMovie } from "@/types";
import { formatRuntime, formatRating } from "@/lib/utils";

interface Props {
  movie: RecommendedMovie;
}

export function RecommendedMovieCard({ movie }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden border border-scene-border bg-scene-surface shadow-card"
    >
      {/* Backdrop blur layer */}
      {movie.backdropUrl && (
        <div className="absolute inset-0">
          <Image
            src={movie.backdropUrl}
            alt=""
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-scene-surface via-scene-surface/95 to-scene-surface/70" />
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6 md:p-8">
        {/* Poster */}
        <div className="flex-shrink-0 w-36 md:w-44 mx-auto md:mx-0">
          <div className="poster-ratio rounded-xl overflow-hidden bg-scene-elevated border border-scene-border shadow-card-hover">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={176}
                height={264}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-scene-text-dim">
                <span className="font-mono text-xs">No poster</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Recommended label */}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-scene-amber" />
              <span className="font-mono text-xs tracking-widest text-scene-amber uppercase">
                Tonight's Pick
              </span>
            </div>

            {/* Title + year */}
            <h2 className="font-display text-3xl md:text-4xl text-scene-text leading-tight mb-1">
              {movie.title}
            </h2>
            <p className="text-scene-text-muted text-sm mb-4">
              {movie.year}
              {movie.director && (
                <span>
                  {" "}
                  · Directed by{" "}
                  <span className="text-scene-text">{movie.director}</span>
                </span>
              )}
            </p>

            {/* Metadata pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.tmdbRating && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-scene-amber/10 border border-scene-amber/20 text-scene-amber text-xs font-mono">
                  <Star size={11} fill="currentColor" />
                  {formatRating(movie.tmdbRating)}
                </span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-scene-elevated border border-scene-border text-scene-text-muted text-xs">
                  <Clock size={11} />
                  {formatRuntime(movie.runtime)}
                </span>
              )}
              {movie.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-lg bg-scene-elevated border border-scene-border text-scene-text-muted text-xs"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* AI Explanation */}
            <div className="border-l-2 border-scene-amber/40 pl-4 mb-5">
              <p className="text-scene-text-muted text-sm leading-relaxed">
                {movie.aiExplanation}
              </p>
            </div>
          </div>

          {/* CTA */}
          <a
            href={movie.letterboxdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-xl bg-scene-amber text-scene-bg text-sm font-semibold hover:bg-scene-gold transition-colors shadow-amber-glow-sm"
          >
            <ExternalLink size={14} />
            View on Letterboxd
          </a>
        </div>
      </div>
    </motion.div>
  );
}
