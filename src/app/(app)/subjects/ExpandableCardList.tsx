"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ExpandableCardList<T>({
  items,
  renderItem,
  keyOf,
  visibleCount = 4,
  labelMore,
  labelLess,
  emptyMessage,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyOf: (item: T) => string;
  visibleCount?: number;
  labelMore: string;
  labelLess: string;
  emptyMessage: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const visible = items.slice(0, visibleCount);
  const rest = items.slice(visibleCount);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <div key={keyOf(item)}>{renderItem(item)}</div>
        ))}
      </div>
      {rest.length > 0 && (
        <>
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <div key={keyOf(item)}>{renderItem(item)}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> {labelLess}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> {labelMore}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
