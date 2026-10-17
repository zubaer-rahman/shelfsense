"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <EmptyState
          icon={FileQuestion}
          title="Page Not Found"
          description="The requested dispensary view or resource does not exist or has been moved."
        />
        <div className="mt-5">
          <Button asChild size="sm">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
