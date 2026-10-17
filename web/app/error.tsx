"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log unexpected client-side runtime errors
    console.error("Runtime error caught by app error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
          <AlertOctagon className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Application Error
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {error.message || "An unexpected error occurred while rendering this interface. Telemetry has recorded this event."}
        </p>

        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 py-1 px-2 rounded">
            Error digest: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            onClick={() => reset()}
            variant="default"
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 cursor-pointer">
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
