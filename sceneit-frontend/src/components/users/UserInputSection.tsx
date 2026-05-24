"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Users } from "lucide-react";
import { useStore } from "@/stores/useStore";
import { UserInputRow } from "./UserInputRow";
import { cn } from "@/lib/utils";

export function UserInputSection() {
  const { users, addUser, clearUsers } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    if (users.length >= 8) return;
    addUser({
      id: crypto.randomUUID(),
      username: "",
      status: "idle",
    });
    // Focus the new row's input after render
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        "[data-username-input]",
      );
      inputs[inputs.length - 1]?.focus();
    }, 50);
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-scene-amber/10 border border-scene-amber/20 flex items-center justify-center">
            <Users size={15} className="text-scene-amber" />
          </div>
          <div>
            <h2 className="font-body font-semibold text-scene-text text-sm">
              Letterboxd Usernames
            </h2>
            <p className="text-scene-text-dim text-xs mt-0.5">
              Add 2–8 users with public watchlists
            </p>
          </div>
        </div>

        {users.length > 0 && (
          <button
            onClick={clearUsers}
            className="flex items-center gap-1.5 text-xs text-scene-text-dim hover:text-scene-red transition-colors"
          >
            <Trash2 size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* User rows */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 10 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <UserInputRow entry={user} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {users.length === 0 && (
          <div className="text-center py-8 text-scene-text-dim text-sm">
            <p>No users added yet.</p>
            <p className="text-xs mt-1 text-scene-text-dim/60">
              Click "Add User" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Add user button */}
      {users.length < 8 && (
        <motion.button
          onClick={handleAdd}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-2",
            "py-2.5 rounded-xl border border-dashed border-scene-border",
            "text-sm text-scene-text-dim hover:text-scene-amber hover:border-scene-amber/40",
            "transition-all duration-200",
          )}
        >
          <Plus size={14} />
          Add User
        </motion.button>
      )}
    </div>
  );
}
