"use client";

import { useCallback } from "react";
import { compareWatchlists, getApiErrorMessage } from "@/lib/api";
import { useStore } from "@/stores/useStore";

/**
 * useCompare
 *
 * Encapsulates the compare flow:
 *   - Reads valid usernames from the store
 *   - Calls POST /api/compare
 *   - Updates store with result or error
 *
 * Returns a `compare` trigger function and derived loading/error state.
 */
export function useCompare() {
  const {
    users,
    mood,
    compareStatus,
    compareResult,
    compareError,
    setCompareStatus,
    setCompareResult,
    setCompareError,
    resetCompare,
  } = useStore();

  const validUsers = users.filter((u) => u.status === "valid");
  const canCompare = validUsers.length >= 2 && compareStatus !== "loading";

  const compare = useCallback(async () => {
    if (!canCompare) return;

    setCompareStatus("loading");

    try {
      const result = await compareWatchlists({
        usernames: validUsers.map((u) => u.username),
        mood: mood === "any" ? undefined : mood,
      });
      setCompareResult(result);
    } catch (err) {
      setCompareError(getApiErrorMessage(err));
    }
  }, [
    canCompare,
    validUsers,
    mood,
    setCompareStatus,
    setCompareResult,
    setCompareError,
  ]);

  return {
    compare,
    canCompare,
    isLoading: compareStatus === "loading",
    isSuccess: compareStatus === "success",
    isError: compareStatus === "error",
    result: compareResult,
    error: compareError,
    reset: resetCompare,
    validUserCount: validUsers.length,
  };
}
