"use client";

import { AlertCircle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-scene-surface border border-scene-red/30 rounded-2xl px-6 py-8 text-center">
      <AlertCircle
        size={32}
        className="text-scene-red mx-auto mb-3 opacity-80"
      />
      <h3 className="font-body font-semibold text-scene-text mb-1">
        Couldn't complete comparison
      </h3>
      <p className="text-scene-text-muted text-sm max-w-sm mx-auto">
        {message}
      </p>
    </div>
  );
}
