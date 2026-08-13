"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Search, Heart, ShoppingBag } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import SearchSidebar from "../SearchSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { MenuType } from "@/type/menyType";
import type { NavbarConfig } from "@/lib/cms/siteChrome";

interface NavbarProps {
  menuData: MenuType[];
  logoUrl: string | null;
  storeName: string;
  config: NavbarConfig;
  preview?: boolean;
}

export default function Navbar({
  menuData,
  logoUrl,
  storeName,
  config,
  preview = false,
}: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeCategory = searchParams.get("category")?.trim() || null;
  const centered = config.variant === "centered";

  useEffect(() => {
    if (preview) return;
    const onScroll = () => {
      setScrolled((window.scrollY || document.documentElement.scrollTop) > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview]);

  return (
    <>
      <header
        className={cn(
          "z-50 transition-all duration-500",
          preview
            ? "relative rounded-xl border border-border bg-background [&_a]:pointer-events-none [&_button]:pointer-events-none"
            : "absolute inset-x-0 top-0 md:fixed md:inset-x-0 md:top-0",
          centered || preview
            ? "md:border-b md:border-border md:bg-background/90 md:backdrop-blur-xl"
            : "bg-transparent",
          scrolled &&
            "md:border-b md:border-border md:bg-background/80 md:backdrop-blur-xl md:backdrop-saturate-150",
        )}
      >
        <div
          className={cn(
            "mx-auto h-16 max-w-[1600px] gap-2 px-4 sm:h-20 sm:px-6 md:px-10",
            centered
              ? "flex items-center justify-between md:grid md:h-28 md:grid-cols-[1fr_auto_1fr] md:grid-rows-[4rem_3rem]"
              : "flex items-center justify-between md:grid md:grid-cols-[auto_minmax(0,1fr)_auto]",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center gap-2",
              centered && "md:col-start-2 md:row-start-1 md:justify-self-center",
            )}
            aria-label={storeName}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={storeName}
                width={160}
                height={40}
                priority
                className="h-7 w-auto sm:h-8"
              />
            ) : (
              <span className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {storeName}
              </span>
            )}
          </Link>

          <nav
            className={cn(
              "hidden items-center md:flex md:gap-4 lg:gap-8 xl:gap-10",
              centered
                ? "md:col-span-3 md:row-start-2 md:justify-self-center md:border-t md:border-border/60 md:px-10"
                : "md:max-w-[48vw] md:justify-self-center md:overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {menuData.map((menu, index) => {
              if (!menu.href) return null;
              const active = isActivePath(pathname, menu.href);
              const linkClass = cn(
                "group relative text-[13px] font-medium uppercase tracking-[0.2em] transition",
                active
                  ? "text-primary"
                  : "text-foreground/80 hover:text-foreground",
              );
              const underlineClass = cn(
                "absolute -bottom-1 left-0 h-px bg-primary transition-all duration-500",
                active ? "w-full" : "w-0 group-hover:w-full",
              );

              if (menu.items?.length) {
                return (
                  <DropdownMenu key={index} modal={false}>
                    <DropdownMenuTrigger
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        linkClass,
                        "inline-flex items-center gap-1 outline-none",
                      )}
                    >
                      {menu.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      <span className={underlineClass} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="min-w-48 border-border bg-popover p-1 text-popover-foreground"
                    >
                      {menu.items.map((item) => {
                        const itemPath = item.href.split("?")[0] || item.href;
                        const itemCategory =
                          new URLSearchParams(
                            item.href.includes("?")
                              ? item.href.split("?")[1]
                              : "",
                          ).get("category") || null;
                        const itemActive =
                          pathname === itemPath &&
                          (itemCategory
                            ? activeCategory === itemCategory
                            : !activeCategory);

                        return (
                          <DropdownMenuItem
                            key={item.href}
                            asChild
                            className={cn(
                              "cursor-pointer rounded-sm px-3 py-2.5 text-[13px] font-medium uppercase tracking-[0.16em] focus:bg-foreground/5 focus:text-foreground",
                              itemActive
                                ? "bg-foreground/5 text-primary"
                                : "text-foreground/80",
                            )}
                          >
                            <Link href={item.href}>{item.label}</Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={index}
                  href={menu.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass}
                >
                  {menu.label}
                  <span className={underlineClass} />
                </Link>
              );
            })}
          </nav>

          <div
            className={cn(
              "hidden shrink-0 items-center gap-0.5 sm:gap-1 md:flex",
              centered &&
                "md:col-start-3 md:row-start-1 md:justify-self-end",
            )}
          >
            <IconBtn label="Search" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-4 w-4" />
            </IconBtn>
            <Link
              href="/wishlist"
              aria-label="Favorites"
              aria-current={
                isActivePath(pathname, "/wishlist") ? "page" : undefined
              }
              className={cn(
                "relative grid size-11 place-items-center rounded-full transition hover:bg-foreground/5",
                isActivePath(pathname, "/wishlist")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  (wishlistCount > 0 || isActivePath(pathname, "/wishlist")) &&
                    "fill-primary text-primary",
                )}
              />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              aria-current={
                isActivePath(pathname, "/cart") ? "page" : undefined
              }
              className={cn(
                "relative grid size-11 place-items-center rounded-full transition hover:bg-foreground/5",
                isActivePath(pathname, "/cart")
                  ? "text-primary"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {!preview ? (
        <>
          <MobileBottomNav onSearchOpen={() => setIsSearchOpen(true)} />
          <SearchSidebar open={isSearchOpen} onOpenChange={setIsSearchOpen} />
        </>
      ) : null}
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative grid size-11 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/5 hover:text-foreground"
    >
      {children}
    </button>
  );
}
