"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-[52vh] flex flex-col items-center justify-center overflow-hidden grain-overlay px-6 pt-16 pb-10">
      {/* Background — radial amber glow emanating from center */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-scene-amber opacity-[0.04] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-scene-gold opacity-[0.06] blur-[80px]" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="h-px w-8 bg-scene-amber opacity-60" />
          <span className="font-mono text-xs tracking-[0.2em] text-scene-amber uppercase">
            Letterboxd Watchlist Comparison
          </span>
          <span className="h-px w-8 bg-scene-amber opacity-60" />
        </motion.div>

        {/* Logo / Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-7xl md:text-8xl lg:text-9xl leading-none tracking-tight mb-6"
        >
          <span className="text-gradient-amber">Scene</span>
          <span className="text-scene-text">It</span>
          <span className="text-scene-amber text-5xl md:text-6xl align-super ml-1">
            .
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-base md:text-lg text-scene-text-muted max-w-xl mx-auto leading-relaxed"
        >
          For when you and your Letterboxd friends spend{" "}
          <em className="text-scene-gold not-italic">hours</em> trying to find
          what to watch together.
        </motion.p>
      </div>

      {/* Bottom fade into content */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-scene-bg to-transparent pointer-events-none" />
    </section>
  );
}
