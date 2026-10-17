"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-4">
          <FileQuestion className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Page Not Found
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          The requested store view, inventory record, or route does not exist or may have been relocated.
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 cursor-pointer">
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5 cursor-pointer">
            <Link href="/products">
              <Package className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
