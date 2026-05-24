import axios from "axios";
import type {
  LetterboxdUser,
  ValidationStatus,
  CompareResult,
  Mood,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  timeout: 60000, // 60s — compare can take a while on first run
  headers: { "Content-Type": "application/json" },
});

// ── Letterboxd ────────────────────────────────────────────────────────────────

export interface ValidationResponse {
  username: string;
  status: Exclude<ValidationStatus, "idle" | "loading">;
  user?: LetterboxdUser;
  reason?: string;
}

/**
 * Validate a single Letterboxd username.
 * Called by the username input on blur / Enter.
 */
export async function validateUser(
  username: string,
): Promise<ValidationResponse> {
  const { data } = await api.post<ValidationResponse>(
    "/api/letterboxd/validate",
    {
      username,
    },
  );
  return data;
}

// ── Compare ───────────────────────────────────────────────────────────────────

export interface CompareRequest {
  usernames: string[];
  mood?: Mood;
}

/**
 * Run the full watchlist comparison.
 * Returns the recommended movie, all shared movies, and stats.
 */
export async function compareWatchlists(
  req: CompareRequest,
): Promise<CompareResult> {
  const { data } = await api.post<CompareResult>("/api/compare", req);
  return data;
}

// ── Error helper ──────────────────────────────────────────────────────────────

/** Extract a human-readable message from an Axios error */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      "Something went wrong"
    );
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
