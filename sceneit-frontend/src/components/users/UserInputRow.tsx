"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Check, AlertCircle, Loader2, Lock, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/stores/useStore";
import { useValidateUser } from "@/hooks/useValidateUser";
import { cn } from "@/lib/utils";
import type { UserEntry } from "@/types";

interface Props {
  entry: UserEntry;
  index: number;
}

const STATUS_CONFIG = {
  idle: { color: "border-scene-border", icon: null, ring: "" },
  loading: {
    color: "border-scene-border",
    icon: <Loader2 size={14} className="text-scene-text-muted animate-spin" />,
    ring: "",
  },
  valid: {
    color: "border-scene-green/50",
    icon: <Check size={14} className="text-scene-green" />,
    ring: "ring-1 ring-scene-green/20",
  },
  not_found: {
    color: "border-scene-red/50",
    icon: <UserX size={14} className="text-scene-red" />,
    ring: "ring-1 ring-scene-red/20",
  },
  private: {
    color: "border-scene-amber/50",
    icon: <Lock size={14} className="text-scene-amber" />,
    ring: "ring-1 ring-scene-amber/20",
  },
  error: {
    color: "border-scene-red/50",
    icon: <AlertCircle size={14} className="text-scene-red" />,
    ring: "ring-1 ring-scene-red/20",
  },
} as const;

export function UserInputRow({ entry, index }: Props) {
  const { updateUser, removeUser } = useStore();
  const { validate } = useValidateUser();
  const [inputValue, setInputValue] = useState(entry.username);

  const config = STATUS_CONFIG[entry.status];

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    updateUser(entry.id, { username: value, status: "idle", user: undefined });
    validate(entry.id, value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      validate(entry.id, inputValue);
    }
    if (e.key === "Backspace" && inputValue === "") {
      removeUser(entry.id);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-scene-bg",
        "transition-all duration-200",
        config.color,
        config.ring,
      )}
    >
      {/* Index / Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-scene-elevated border border-scene-border flex items-center justify-center">
        {entry.user?.avatarUrl ? (
          <Image
            src={entry.user.avatarUrl}
            alt={entry.user.displayName ?? entry.username}
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-mono text-xs text-scene-text-dim">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex-1 min-w-0">
        <input
          data-username-input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="letterboxd username"
          spellCheck={false}
          autoComplete="off"
          className={cn(
            "w-full bg-transparent text-sm font-mono text-scene-text",
            "placeholder:text-scene-text-dim",
            "outline-none border-none focus:ring-0",
          )}
        />
        {/* Display name or error reason under input */}
        {entry.status === "valid" && entry.user?.displayName && (
          <p className="text-xs text-scene-text-dim mt-0.5 truncate">
            {entry.user.displayName}
          </p>
        )}
        {(entry.status === "not_found" ||
          entry.status === "error" ||
          entry.status === "private") &&
          entry.reason && (
            <p className="text-xs text-scene-red/80 mt-0.5 truncate">
              {entry.reason}
            </p>
          )}
      </div>

      {/* Status icon */}
      <div className="flex-shrink-0 w-5 flex items-center justify-center">
        {config.icon}
      </div>

      {/* Remove button */}
      <button
        onClick={() => removeUser(entry.id)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-scene-text-dim hover:text-scene-red hover:bg-scene-red/10 transition-all"
        aria-label="Remove user"
      >
        <X size={13} />
      </button>
    </div>
  );
}
