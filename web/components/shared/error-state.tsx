import * as React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while connecting to the ShelfSense ledger. Please check connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card
      className={cn(
        "p-12 text-center flex flex-col items-center justify-center border-destructive/20 bg-destructive/5",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mb-4">
        <AlertOctagon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-md mt-1 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-5 gap-1.5 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      )}
    </Card>
  );
}
