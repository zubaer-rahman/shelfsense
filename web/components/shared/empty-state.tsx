import * as React from "react";
import { PackageOpen, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title = "No records found",
  description = "There are no active records matching your current filter criteria or location.",
  icon: Icon = PackageOpen,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "p-12 text-center flex flex-col items-center justify-center border-dashed",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm" className="mt-5">
          {actionText}
        </Button>
      )}
    </Card>
  );
}
