"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, Search, Shirt, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onSearchOpen: () => void;
}

export default function MobileBottomNav({
  onSearchOpen,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());

  const shopActive = isActivePath(pathname, "/product");
  const cartActive = isActivePath(pathname, "/cart");
  const wishlistActive = isActivePath(pathname, "/wishlist");
  const contactActive = isActivePath(pathname, "/contact-us");

  return (
    <nav
      aria-label="Mobile shopping navigation"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div className="relative pt-8">
        {/* Shop FAB — outside the bar so the cutout stays transparent */}
        <Link
          href="/product"
          aria-label="Shop"
          aria-current={shopActive ? "page" : undefined}
          className={cn(
            "absolute left-1/2 top-1 z-20 grid size-14 -translate-x-1/2 place-items-center rounded-full",
            "bg-primary text-primary-foreground",
            "border-[5px] border-white/20",
            "shadow-[0_10px_28px_rgb(var(--primary-rgb)/0.45)]",
            "transition duration-200 hover:scale-[1.04] active:scale-95",
          )}
        >
          <Shirt className="size-6" strokeWidth={2} />
        </Link>

        <div
          className={cn(
            "relative rounded-t-3xl border border-b-0 border-border/60 bg-background",
            "shadow-[0_-12px_40px_rgb(0_0_0/0.35)]",
            "pb-[env(safe-area-inset-bottom)]",
            // Hole under the FAB — page content shows through
            "[mask-image:radial-gradient(circle_34px_at_50%_0px,transparent_33px,#000_34.5px)]",
          )}
        >
          <div className="grid h-16 grid-cols-5 items-center px-1">
            <TabLink
              href="/contact-us"
              label="Contact"
              active={contactActive}
              icon={
                <MessageCircle
                  className="size-5"
                  strokeWidth={contactActive ? 2.25 : 1.75}
                />
              }
            />

            <TabLink
              href="/cart"
              label="Cart"
              active={cartActive}
              badge={itemCount}
              icon={
                <ShoppingBag
                  className="size-5"
                  strokeWidth={cartActive ? 2.25 : 1.75}
                />
              }
            />

            {/* Empty center slot for the floating shop button */}
            <div aria-hidden className="h-full w-full" />

            <TabLink
              href="/wishlist"
              label="Saved"
              active={wishlistActive}
              badge={wishlistCount}
              icon={
                <Heart
                  className={cn("size-5", wishlistActive && "fill-current")}
                  strokeWidth={wishlistActive ? 2.25 : 1.75}
                />
              }
            />

            <button
              type="button"
              aria-label="Search"
              onClick={onSearchOpen}
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground transition active:text-foreground"
            >
              <Search className="size-5" strokeWidth={1.75} />
              <span className="max-w-full truncate px-1 text-[10px] font-medium tracking-wide">
                Search
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-0.5 transition",
        active
          ? "text-primary"
          : "text-muted-foreground active:text-foreground",
      )}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="max-w-full truncate px-1 text-[10px] font-medium tracking-wide">
        {label}
      </span>
    </Link>
  );
}
