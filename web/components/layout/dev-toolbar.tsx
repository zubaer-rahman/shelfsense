"use client";

import * as React from "react";
import {
  Wrench,
  User,
  Loader2,
  Inbox,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DevToolbarProps {
  role?: "OWNER" | "STAFF";
  onRoleChange?: (role: "OWNER" | "STAFF") => void;
  simulateLoading?: boolean;
  onToggleLoading?: () => void;
  simulateEmpty?: boolean;
  onToggleEmpty?: () => void;
  simulateError?: boolean;
  onToggleError?: () => void;
  onReset?: () => void;
}

export function DevToolbar({
  role = "OWNER",
  onRoleChange,
  simulateLoading = false,
  onToggleLoading,
  simulateEmpty = false,
  onToggleEmpty,
  simulateError = false,
  onToggleError,
  onReset,
}: DevToolbarProps) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <aside
      aria-label="Developer Simulation Controls"
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Toggle Expand/Collapse Mini Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-1 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white rounded-md text-[11px] font-medium shadow-md flex items-center gap-1.5 hover:bg-slate-800 transition-colors border border-slate-700 cursor-pointer"
        title="Toggle developer toolbar"
      >
        <Wrench className="w-3 h-3 text-teal-400" />
        <span>Dev Toolbar</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronUp className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-slate-200 border border-slate-700 dark:border-slate-800 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Runtime Simulation
              </span>
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors font-medium cursor-pointer"
              >
                Reset States
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role switch */}
            {onRoleChange && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => onRoleChange("OWNER")}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    role === "OWNER"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-3 h-3" />
                  Owner
                </button>
                <button
                  onClick={() => onRoleChange("STAFF")}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    role === "STAFF"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <User className="w-3 h-3" />
                  Staff
                </button>
              </div>
            )}

            {/* Loading Toggle */}
            {onToggleLoading && (
              <button
                onClick={onToggleLoading}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  simulateLoading
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750"
                }`}
              >
                <Loader2
                  className={`w-3 h-3 ${simulateLoading ? "animate-spin text-amber-400" : "text-slate-400"}`}
                />
                Loading
              </button>
            )}

            {/* Empty Toggle */}
            {onToggleEmpty && (
              <button
                onClick={onToggleEmpty}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  simulateEmpty
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750"
                }`}
              >
                <Inbox className="w-3 h-3 text-blue-400" />
                Empty
              </button>
            )}

            {/* Error Toggle */}
            {onToggleError && (
              <button
                onClick={onToggleError}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  simulateError
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750"
                }`}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                Error
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
