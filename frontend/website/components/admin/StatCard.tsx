import type { CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

// KPI tile for the dashboard. Icon name is any key in components/admin/Icon.
export function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "primary",
  href,
  className,
  style,
}: {
  label: string;
  value: string | number;
  icon: string;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info" | "danger";
  href?: string;
  className?: string;
  style?: CSSProperties;
}) {
  // Semantic tokens (globals.css) — adapt to every storefront palette.
  const accents: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    danger: "bg-danger/15 text-danger",
  };

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            accents[accent],
          )}
        >
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const shellClass = cn(
    "group relative overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-sm transition-all duration-300",
    "hover:border-primary/35 hover:shadow-[0_20px_60px_-36px_rgb(var(--primary-rgb)/0.45)]",
    href && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shellClass} style={style}>
        <span
          className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        {body}
      </Link>
    );
  }

  return (
    <div className={shellClass} style={style}>
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      {body}
    </div>
  );
}
