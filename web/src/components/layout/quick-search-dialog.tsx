"use client";

import * as React from "react";
import { Search, X, Package, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

interface QuickSearchItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

interface QuickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: QuickSearchItem[];
}

export function QuickSearchDialog({
  open,
  onOpenChange,
  items = [],
}: QuickSearchDialogProps) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  // Filter items matching query
  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [items, query]);

  const handleSelect = (item: QuickSearchItem) => {
    onOpenChange(false);
    setQuery("");
    router.push(`/products?search=${encodeURIComponent(item.sku)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Search Catalog</DialogTitle>
        </DialogHeader>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medications, categories, or SKU..."
            className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <Package className="w-6 h-6 mx-auto stroke-[1.5] text-muted-foreground/60 mb-2" />
              <p>Type a product name (e.g. &quot;Amoxicillin&quot; or &quot;Saline&quot;) or SKU</p>
              <p className="text-[11px] text-muted-foreground/70">Press <kbd className="font-mono">ESC</kbd> to close</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No products found matching &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="text-xs font-semibold tabular-nums text-foreground">
                      {item.quantity} in stock
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
