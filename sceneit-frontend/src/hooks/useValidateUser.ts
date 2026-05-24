"use client";

import { useCallback, useRef } from "react";
import { validateUser } from "@/lib/api";
import { useStore } from "@/stores/useStore";

/**
 * useValidateUser
 *
 * Returns a `validate(id, username)` function that:
 *   1. Sets the entry to 'loading'
 *   2. Calls POST /api/letterboxd/validate
 *   3. Updates the entry with the result
 *
 * Includes a debounce so validation only fires 500ms after the user
 * stops typing — avoids spamming the backend on every keystroke.
 */
export function useValidateUser() {
  const { updateUser } = useStore();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const validate = useCallback(
    (id: string, username: string) => {
      // Clear any pending debounce for this input
      if (timers.current[id]) clearTimeout(timers.current[id]);

      const trimmed = username.trim().toLowerCase();

      if (!trimmed) {
        updateUser(id, { status: "idle", user: undefined, reason: undefined });
        return;
      }

      // Debounce: wait 500ms after last keystroke
      timers.current[id] = setTimeout(async () => {
        updateUser(id, { status: "loading" });

        try {
          const result = await validateUser(trimmed);
          updateUser(id, {
            username: trimmed,
            status: result.status,
            user: result.user,
            reason: result.reason,
          });
        } catch {
          updateUser(id, {
            status: "error",
            reason: "Could not reach the server",
          });
        }
      }, 500);
    },
    [updateUser],
  );

  return { validate };
}
