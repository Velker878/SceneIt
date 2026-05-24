"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserInputSection } from "@/components/users/UserInputSection";
import { CompareButton } from "@/components/users/CompareButton";
import { ResultsSection } from "@/components/results/ResultsSection";
import { useCompare } from "@/hooks/useCompare";

export function MainContent() {
  const { isSuccess } = useCompare();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pb-24">
      {/* ── User Input Panel ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <div className="bg-scene-surface border border-scene-border rounded-2xl p-6 md:p-8 shadow-card">
          <UserInputSection />
          <div className="mt-6">
            <CompareButton />
          </div>
        </div>
      </motion.div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10"
          >
            <ResultsSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
