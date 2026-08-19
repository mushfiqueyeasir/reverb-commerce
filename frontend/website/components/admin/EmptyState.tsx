import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared empty-state panel used across admin list pages and tables.
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-border bg-card/80 px-6 text-center",
        compact ? "py-10" : "py-14",
        className,
      )}
    >
      {icon ? (
        <span className="mb-4 grid size-12 place-items-center rounded-full border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-lg font-semibold text-foreground">
        {title}
      </p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}