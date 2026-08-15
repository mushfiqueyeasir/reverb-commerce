"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Grid2X2,
  Heart,
  Search,
  ShoppingBag,
} from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import SearchSidebar from "../SearchSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { MenuLink, MenuType } from "@/type/menyType";
import type { NavbarConfig } from "@/lib/cms/siteChrome";

interface NavbarProps {
  menuData: MenuType[];
  logoUrl: string | null;
  storeName: string;
  config: NavbarConfig;
  aiSearchEnabled?: boolean;
  preview?: boolean;
}

export default function Navbar({
  menuData,
  logoUrl,
  storeName,
  config,
  aiSearchEnabled = false,
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
              centered &&
                "md:col-start-2 md:row-start-1 md:justify-self-center",
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
                    {menu.kind === "categories" ? (
                      <CategoryMegaMenu
                        menu={menu}
                        pathname={pathname}
                        activeCategory={activeCategory}
                      />
                    ) : (
                      <DropdownMenuContent
                        align="start"
                        className="min-w-48 border-border bg-popover p-1 text-popover-foreground"
                      >
                        {menu.items.map((item) => (
                          <MenuLinkItem
                            key={item.href}
                            item={item}
                            pathname={pathname}
                            activeCategory={activeCategory}
                          />
                        ))}
                      </DropdownMenuContent>
                    )}
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
              centered && "md:col-start-3 md:row-start-1 md:justify-self-end",
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
          <SearchSidebar
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            aiSearchEnabled={aiSearchEnabled}
          />
        </>
      ) : null}
    </>
  );
}

function itemIsActive(
  item: MenuLink,
  pathname: string,
  activeCategory: string | null,
): boolean {
  const [itemPath, query = ""] = item.href.split("?");
  const itemCategory = new URLSearchParams(query).get("category");
  return (
    pathname === itemPath &&
    (itemCategory ? activeCategory === itemCategory : !activeCategory)
  );
}

function branchIsActive(
  item: MenuLink,
  pathname: string,
  activeCategory: string | null,
): boolean {
  return (
    itemIsActive(item, pathname, activeCategory) ||
    Boolean(
      item.items?.some((child) =>
        branchIsActive(child, pathname, activeCategory),
      ),
    )
  );
}

function flattenMenuLinks(items: MenuLink[]): MenuLink[] {
  return items.flatMap((item) => [item, ...flattenMenuLinks(item.items ?? [])]);
}

function MenuLinkItem({
  item,
  pathname,
  activeCategory,
  className,
}: {
  item: MenuLink;
  pathname: string;
  activeCategory: string | null;
  className?: string;
}) {
  const active = itemIsActive(item, pathname, activeCategory);
  return (
    <DropdownMenuItem
      asChild
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2.5 text-[13px] font-medium focus:bg-foreground/5 focus:text-foreground",
        active ? "bg-primary/10 text-primary" : "text-foreground/80",
        className,
      )}
    >
      <Link href={item.href} aria-current={active ? "page" : undefined}>
        {item.label}
      </Link>
    </DropdownMenuItem>
  );
}

export function CategoryMegaMenu({
  menu,
  pathname,
  activeCategory,
}: {
  menu: MenuType;
  pathname: string;
  activeCategory: string | null;
}) {
  const allProducts = menu.items?.find((item) => item.isDefault);
  const groups = menu.items?.filter((item) => !item.isDefault) ?? [];
  const activeGroup = groups.find((group) =>
    branchIsActive(group, pathname, activeCategory),
  );
  const [selectedHref, setSelectedHref] = useState(
    activeGroup?.href ?? groups[0]?.href ?? "",
  );
  const selectedGroup =
    groups.find((group) => group.href === selectedHref) ??
    activeGroup ??
    groups[0];
  const hasSubcategories = groups.some((group) => group.items?.length);

  if (!hasSubcategories) {
    return (
      <CompactCategoryMenu
        allProducts={allProducts}
        groups={groups}
        pathname={pathname}
        activeCategory={activeCategory}
      />
    );
  }

  const selectedChildren = flattenMenuLinks(selectedGroup?.items ?? []);

  return (
    <DropdownMenuContent
      align="start"
      collisionPadding={16}
      className="w-[min(92vw,900px)] overflow-hidden rounded-[1.25rem] border-border bg-popover p-0 text-popover-foreground shadow-[0_28px_90px_rgb(0_0_0/0.35)]"
    >
      <div className="flex items-center justify-between gap-5 border-b border-border px-6 py-5">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Grid2X2 className="size-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
              Collections
            </span>
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-foreground">
            Shop by category
          </p>
        </div>
        {allProducts ? (
          <MenuLinkItem
            item={allProducts}
            pathname={pathname}
            activeCategory={activeCategory}
            className="shrink-0 border border-border bg-background px-4 uppercase tracking-[0.12em]"
          />
        ) : null}
      </div>

      <div className="grid min-h-[430px] grid-cols-[230px_minmax(0,1fr)]">
        <ScrollArea className="h-[min(62vh,520px)] border-r border-border bg-foreground/[0.025]">
          <div className="p-3 pr-5">
            {groups.map((group) => {
              const selected = group.href === selectedGroup?.href;
              const active = branchIsActive(group, pathname, activeCategory);
              return (
                <DropdownMenuItem
                  key={group.href}
                  asChild
                  onPointerMove={() => setSelectedHref(group.href)}
                  onFocus={() => setSelectedHref(group.href)}
                  className={cn(
                    "mb-1 cursor-pointer rounded-xl p-0 focus:bg-transparent",
                    selected && "bg-background shadow-sm",
                  )}
                >
                  <Link
                    href={group.href}
                    className="flex w-full items-center gap-3 px-3 py-3"
                  >
                    <CategoryThumb item={group} size="small" />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm font-medium",
                        active || selected
                          ? "text-primary"
                          : "text-foreground/75",
                      )}
                    >
                      {group.label}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>

        <ScrollArea className="h-[min(62vh,520px)]">
          <div className="p-5 pr-7">
            {selectedGroup ? (
              <>
                <Link
                  href={selectedGroup.href}
                  className="group relative flex min-h-36 overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  {selectedGroup.imageUrl ? (
                    <Image
                      src={selectedGroup.imageUrl}
                      alt=""
                      fill
                      sizes="640px"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
                  <div className="relative flex w-full items-end justify-between gap-4 p-5 text-white">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/65">
                        Primary category
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-semibold">
                        {selectedGroup.label}
                      </h3>
                    </div>
                    <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]">
                      Explore <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>

                {selectedChildren.length ? (
                  <div className="mt-5 grid grid-cols-2 gap-1">
                    {selectedChildren.map((item) => (
                      <MenuLinkItem
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        activeCategory={activeCategory}
                        className="py-3"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Explore all products in this collection.
                  </p>
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </DropdownMenuContent>
  );
}

function CompactCategoryMenu({
  allProducts,
  groups,
  pathname,
  activeCategory,
}: {
  allProducts: MenuLink | undefined;
  groups: MenuLink[];
  pathname: string;
  activeCategory: string | null;
}) {
  return (
    <DropdownMenuContent
      align="start"
      collisionPadding={16}
      className="w-[min(90vw,470px)] rounded-[1.25rem] border-border bg-popover p-3 text-popover-foreground shadow-[0_24px_70px_rgb(0_0_0/0.32)]"
    >
      <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">
            Shop categories
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Find your collection.
          </p>
        </div>
        {allProducts ? (
          <MenuLinkItem
            item={allProducts}
            pathname={pathname}
            activeCategory={activeCategory}
            className="border border-border bg-background px-4"
          />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
        {groups.map((group) => {
          const active = itemIsActive(group, pathname, activeCategory);
          return (
            <DropdownMenuItem
              key={group.href}
              asChild
              className={cn(
                "cursor-pointer rounded-xl p-0 focus:bg-foreground/5",
                active && "bg-primary/10",
              )}
            >
              <Link href={group.href} className="flex items-center gap-3 p-3">
                <CategoryThumb item={group} size="large" />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm font-medium",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {group.label}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>
          );
        })}
      </div>
    </DropdownMenuContent>
  );
}

function CategoryThumb({
  item,
  size,
}: {
  item: MenuLink;
  size: "small" | "large";
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-border bg-surface",
        size === "small" ? "size-9" : "size-12",
      )}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          fill
          sizes={size === "small" ? "36px" : "48px"}
          className="object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center text-muted-foreground">
          <Grid2X2 className="size-4" />
        </span>
      )}
    </span>
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
