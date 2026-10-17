"use client";

import * as React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global critical layout error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-900 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <AlertOctagon className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">
            System Level Error
          </h1>

          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            A critical system-level fault occurred in the application shell.
          </p>

          <button
            onClick={() => reset()}
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
