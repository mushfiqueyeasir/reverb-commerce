"use client";

import Link from "next/link";
import { Heart, Home, Search, ShoppingBag, Zap } from "lucide-react";
import type { NavbarCopy } from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface VoltMobileNavProps {
  pathname: string;
  itemCount: number;
  wishlistCount: number;
  onSearchOpen: () => void;
  copy: NavbarCopy;
}

export default function VoltMobileNav({
  pathname,
  itemCount,
  wishlistCount,
  onSearchOpen,
  copy,
}: VoltMobileNavProps) {
  return (
    <nav
      aria-label={copy.mobileNavigationAriaLabel}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-md items-center justify-between rounded-2xl border border-border bg-background/75 px-2 shadow-[0_18px_50px_-20px_rgb(0_0_0/0.65),0_0_0_1px_rgb(var(--primary-rgb)/0.06)] backdrop-blur-2xl backdrop-saturate-150">
        <VoltTab
          href="/"
          label={copy.mobileHomeLabel}
          active={isActivePath(pathname, "/")}
          icon={<Home className="size-[1.15rem]" />}
        />
        <VoltTab
          href="/wishlist"
          label={copy.mobileSavedLabel}
          active={isActivePath(pathname, "/wishlist")}
          icon={<Heart className="size-[1.15rem]" />}
          badge={wishlistCount}
          countOverflowLabel={copy.countOverflowLabel}
        />
        <Link
          href="/product"
          aria-label={copy.mobileShopLabel}
          aria-current={isActivePath(pathname, "/product") ? "page" : undefined}
          className="group relative -mt-8 grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_34px_-10px_rgb(var(--primary-rgb)/0.8)] ring-4 ring-background transition-transform duration-200 active:scale-95"
        >
          <Zap className="size-7" fill="currentColor" />
        </Link>
        <VoltTab
          href="/cart"
          label={copy.mobileBagLabel}
          active={isActivePath(pathname, "/cart")}
          icon={<ShoppingBag className="size-[1.15rem]" />}
          badge={itemCount}
          countOverflowLabel={copy.countOverflowLabel}
        />
        <button
          type="button"
          aria-label={copy.mobileSearchAriaLabel}
          onClick={onSearchOpen}
          className="flex w-16 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors active:text-primary"
        >
          <Search className="size-[1.15rem]" />
          <span className="text-[10px] font-medium">
            {copy.mobileSearchLabel}
          </span>
        </button>
      </div>
    </nav>
  );
}

function VoltTab({
  href,
  label,
  active,
  icon,
  badge = 0,
  countOverflowLabel,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
  countOverflowLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-200 active:scale-95",
        active ? "text-primary" : "text-muted-foreground active:text-primary",
      )}
    >
      <span className="relative grid place-items-center">
        {icon}
        {badge > 0 ? (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
            {badge > 9 ? (countOverflowLabel ?? "9+") : badge}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}