"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, EmptyStateProps } from "@/components/shared/empty-state";
import { ErrorState, ErrorStateProps } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState?: EmptyStateProps;
  keyExtractor?: (item: T, index: number) => string | number;
  // Optional Pagination
  page?: number;
  totalPages?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyState,
  keyExtractor,
  page,
  totalPages,
  totalRecords,
  onPageChange,
  className,
}: DataTableProps<T>) {
  // Error state
  if (isError) {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  // Loading state (skeleton rows)
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-xs", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.headerClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rIdx) => (
              <TableRow key={rIdx}>
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx} className={col.className}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState {...emptyState} className={className} />;
  }

  // Success state: rendered table
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-xs", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rIdx) => {
            const key = keyExtractor ? keyExtractor(row, rIdx) : (row as { id?: string }).id || rIdx;
            return (
              <TableRow key={key}>
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx} className={col.className}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? "—")
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination controls if totalPages provided */}
      {totalPages && totalPages > 1 && onPageChange && page && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <div>
            Showing page <span className="font-semibold text-foreground">{page}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
            {totalRecords ? ` (${totalRecords} items)` : ""}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 gap-1 px-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 gap-1 px-2.5"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
