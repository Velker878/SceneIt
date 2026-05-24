import { create } from "zustand";
import type { UserEntry, CompareResult, FilterState, Mood } from "@/types";

// ── User entries slice ────────────────────────────────────────────────────────

interface UserSlice {
  users: UserEntry[];
  addUser: (entry: UserEntry) => void;
  updateUser: (id: string, patch: Partial<UserEntry>) => void;
  removeUser: (id: string) => void;
  clearUsers: () => void;
}

// ── Compare slice ─────────────────────────────────────────────────────────────

type CompareStatus = "idle" | "loading" | "success" | "error";

interface CompareSlice {
  compareStatus: CompareStatus;
  compareResult: CompareResult | null;
  compareError: string | null;
  mood: Mood;
  setMood: (mood: Mood) => void;
  setCompareStatus: (status: CompareStatus) => void;
  setCompareResult: (result: CompareResult) => void;
  setCompareError: (err: string) => void;
  resetCompare: () => void;
}

// ── Filter slice ──────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: FilterState = {
  genres: [],
  maxRuntime: null,
  minRating: null,
  decade: null,
  sort: "score",
};

interface FilterSlice {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void;
  resetFilters: () => void;
}

// ── Combined store ────────────────────────────────────────────────────────────

type SceneItStore = UserSlice & CompareSlice & FilterSlice;

export const useStore = create<SceneItStore>((set) => ({
  // ── Users ──────────────────────────────────────────────────────────────────
  users: [],

  addUser: (entry) => set((state) => ({ users: [...state.users, entry] })),

  updateUser: (id, patch) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),

  removeUser: (id) =>
    set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

  clearUsers: () => set({ users: [] }),

  // ── Compare ────────────────────────────────────────────────────────────────
  compareStatus: "idle",
  compareResult: null,
  compareError: null,
  mood: "any",

  setMood: (mood) => set({ mood }),
  setCompareStatus: (status) => set({ compareStatus: status }),
  setCompareResult: (result) =>
    set({ compareResult: result, compareStatus: "success" }),
  setCompareError: (err) => set({ compareError: err, compareStatus: "error" }),
  resetCompare: () =>
    set({ compareStatus: "idle", compareResult: null, compareError: null }),

  // ── Filters ────────────────────────────────────────────────────────────────
  filters: DEFAULT_FILTERS,

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
