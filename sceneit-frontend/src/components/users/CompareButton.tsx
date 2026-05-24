"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Film, Loader2, RefreshCw } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { useStore } from "@/stores/useStore";
import { cn } from "@/lib/utils";
import type { Mood } from "@/types";

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "any", label: "Any mood", emoji: "🎬" },
  { value: "light", label: "Light", emoji: "☀️" },
  { value: "funny", label: "Funny", emoji: "😄" },
  { value: "emotional", label: "Emotional", emoji: "😢" },
  { value: "thrilling", label: "Thrilling", emoji: "😱" },
  { value: "romantic", label: "Romantic", emoji: "❤️" },
  { value: "mind-bending", label: "Mind-bending", emoji: "🌀" },
];

export function CompareButton() {
  const { compare, canCompare, isLoading, isSuccess, validUserCount, reset } =
    useCompare();
  const { mood, setMood } = useStore();

  async function handleClick() {
    if (isSuccess) {
      reset();
      return;
    }
    await compare();
  }

  return (
    <div className="space-y-4">
      {/* Mood selector */}
      <div>
        <p className="text-xs font-mono text-scene-text-dim mb-2 tracking-wide uppercase">
          Group Mood
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body transition-all duration-150",
                mood === m.value
                  ? "bg-scene-amber/15 border border-scene-amber/40 text-scene-amber"
                  : "bg-scene-elevated border border-scene-border text-scene-text-muted hover:border-scene-muted",
              )}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main button */}
      <motion.button
        onClick={handleClick}
        disabled={!canCompare && !isSuccess}
        whileHover={canCompare || isSuccess ? { scale: 1.01 } : {}}
        whileTap={canCompare || isSuccess ? { scale: 0.99 } : {}}
        className={cn(
          "relative w-full py-4 rounded-xl font-body font-semibold text-sm",
          "flex items-center justify-center gap-2.5",
          "transition-all duration-200",
          // Active state
          (canCompare || isSuccess) && !isLoading
            ? "bg-scene-amber text-scene-bg shadow-amber-glow hover:bg-scene-gold cursor-pointer"
            : "",
          // Loading state
          isLoading ? "bg-scene-amber/80 text-scene-bg cursor-not-allowed" : "",
          // Disabled
          !canCompare && !isSuccess && !isLoading
            ? "bg-scene-elevated border border-scene-border text-scene-text-dim cursor-not-allowed"
            : "",
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 size={16} className="animate-spin" />
              Comparing watchlists…
            </motion.span>
          ) : isSuccess ? (
            <motion.span
              key="reset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Compare Again
            </motion.span>
          ) : (
            <motion.span
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Film size={16} />
              {validUserCount < 2
                ? `Add ${2 - validUserCount} more user${2 - validUserCount !== 1 ? "s" : ""} to compare`
                : `Compare ${validUserCount} Watchlists`}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
