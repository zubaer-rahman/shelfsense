import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  isLoading?: boolean;
  accentColor?: string; // CSS variable or class
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  isLoading,
  accentColor,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("p-5 flex flex-col justify-between space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-36" />
      </Card>
    );
  }

  return (
    <Card className={cn("p-5 flex flex-col justify-between space-y-3 relative overflow-hidden", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/50",
              accentColor || "bg-muted text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value ?? "—"}
        </div>
        {(subtitle || trend || badge) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-[11px]">
                {badge}
              </span>
            )}
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
