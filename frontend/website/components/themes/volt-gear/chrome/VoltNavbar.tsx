"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";
import VoltMobileNav from "./VoltMobileNav";
import { CategoryMegaMenu } from "@/components/Common/Header/Navbar";
import SearchSidebar from "@/components/Common/SearchSidebar";
import { OPEN_AI_SEARCH_EVENT } from "@/components/Common/searchUi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  interpolateChromeTemplate,
  isExternalChromeHref,
  isSafeChromeHref,
  type NavbarCopy,
} from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { MenuType } from "@/type/menyType";

interface VoltNavbarProps {
  menuData: MenuType[];
  logoUrl: string | null;
  storeName: string;
  copy: NavbarCopy;
  announcementText?: string | null;
  announcementActive?: boolean;
  announcementUrl?: string | null;
  aiSearchEnabled?: boolean;
  preview?: boolean;
}

const NAV_PILL_ID = "volt-nav-pill";

export default function VoltNavbar({
  menuData,
  logoUrl,
  storeName,
  copy,
  announcementText,
  announcementActive = false,
  announcementUrl,
  aiSearchEnabled = false,
  preview = false,
}: VoltNavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<"search" | "advisor">("search");
  const [scrolled, setScrolled] = useState(false);
  const activeCategory = searchParams.get("category")?.trim() || null;
  const menus = menuData.filter((menu): menu is MenuType & { href: string } =>
    Boolean(menu.href && isSafeChromeHref(menu.href)),
  );
  const showAnnouncement = Boolean(
    announcementActive && announcementText?.trim(),
  );

  useEffect(() => {
    if (preview) return;
    const onScroll = () => {
      setScrolled((window.scrollY || document.documentElement.scrollTop) > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview]);

  useEffect(() => {
    const openAiSearch = () => {
      setSearchTab("advisor");
      setIsSearchOpen(true);
    };
    window.addEventListener(OPEN_AI_SEARCH_EVENT, openAiSearch);
    return () => window.removeEventListener(OPEN_AI_SEARCH_EVENT, openAiSearch);
  }, []);

  const openSearch = () => {
    setSearchTab("search");
    setIsSearchOpen(true);
  };

  return (
    <>
      <header
        className={cn(
          preview
            ? "relative z-50 overflow-hidden rounded-xl border border-border [&_a]:pointer-events-none [&_button]:pointer-events-none"
            : "sticky top-0 z-50",
        )}
      >
        {showAnnouncement ? (
          <VoltAnnouncement text={announcementText!.trim()} href={announcementUrl} />
        ) : null}

        <div
          className={cn(
            "border-b transition-all duration-500 motion-reduce:transition-none",
            scrolled || preview
              ? "border-border bg-background/80 shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_50px_-24px_rgb(var(--primary-rgb)/0.25)] backdrop-blur-2xl backdrop-saturate-150"
              : "border-transparent bg-background/45 backdrop-blur-md",
          )}
        >
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 md:h-20 md:px-10">
            <Link
              href="/"
              aria-label={interpolateChromeTemplate(
                copy.homeLinkAriaLabelTemplate,
                { storeName },
                ["storeName"],
              )}
              className="flex min-w-0 items-center gap-2.5 active:opacity-80"
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={160}
                  height={44}
                  priority
                  className="h-7 w-auto object-contain sm:h-8"
                />
              ) : (
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_18px_rgb(var(--primary-rgb)/0.45)] sm:size-8">
                    <Zap className="size-4 sm:size-5" fill="currentColor" />
                  </span>
                  <span className="truncate font-display text-xl font-bold tracking-[-0.04em] text-foreground sm:text-2xl">
                    {storeName}
                  </span>
                </span>
              )}
            </Link>

            <nav
              aria-label={copy.primaryNavigationAriaLabel}
              className="hidden min-w-0 flex-1 items-center justify-center md:flex"
            >
              <div className="flex min-w-0 items-center gap-1 rounded-full p-1">
                {menus.map((menu) => (
                  <VoltMenuLink
                    key={`${menu.kind}-${menu.label}-${menu.href}`}
                    menu={menu}
                    pathname={pathname}
                    activeCategory={activeCategory}
                    copy={copy}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <VoltIconButton
                label={copy.desktopSearchAriaLabel}
                onClick={openSearch}
              >
                <Search className="size-[1.15rem]" />
              </VoltIconButton>
              <VoltIconLink
                href="/wishlist"
                label={copy.desktopFavoritesAriaLabel}
                count={wishlistCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/wishlist")}
              >
                <Heart
                  className={cn(
                    "size-[1.15rem]",
                    wishlistCount > 0 && "fill-current",
                  )}
                />
              </VoltIconLink>
              <VoltCartButton
                href="/cart"
                label={copy.desktopBagAriaLabel}
                count={itemCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/cart")}
              />
            </div>
          </div>
        </div>
      </header>

      {!preview ? (
        <>
          <VoltMobileNav
            pathname={pathname}
            itemCount={itemCount}
            wishlistCount={wishlistCount}
            onSearchOpen={openSearch}
            copy={copy}
          />
          <SearchSidebar
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            aiSearchEnabled={aiSearchEnabled}
            initialTab={searchTab}
          />
        </>
      ) : null}
    </>
  );
}

function VoltAnnouncement({
  text,
  href,
}: {
  text: string;
  href?: string | null;
}) {
  const safeHref = href?.trim() && isSafeChromeHref(href) ? href.trim() : null;
  const content = (
    <span className="inline-flex items-center justify-center gap-2">
      <Sparkles className="size-3.5" aria-hidden />
      <span>{text}</span>
      {safeHref ? <span aria-hidden>→</span> : null}
    </span>
  );

  return (
    <div className="border-b border-primary/15 bg-primary/10 px-4 py-1.5 text-center text-xs font-medium tracking-[0.04em] text-foreground">
      {safeHref ? (
        <Link
          href={safeHref}
          {...(isExternalChromeHref(safeHref)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="inline-flex transition-colors hover:text-primary"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function VoltMenuLink({
  menu,
  pathname,
  activeCategory,
  copy,
  reduceMotion,
}: {
  menu: MenuType & { href: string };
  pathname: string;
  activeCategory: string | null;
  copy: NavbarCopy;
  reduceMotion: boolean | null;
}) {
  const external = isExternalChromeHref(menu.href);
  const active = !external && isActivePath(pathname, menu.href);
  const children = menu.items?.filter((item) => isSafeChromeHref(item.href));

  const linkClass = cn(
    "relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-foreground/70 transition-colors duration-200 hover:text-foreground active:scale-95",
    active && "text-foreground",
  );

  const label = (
    <>
      {active ? (
        <motion.span
          layoutId={NAV_PILL_ID}
          className="absolute inset-0 rounded-full bg-foreground/[0.08] ring-1 ring-inset ring-primary/20"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", bounce: 0, duration: 0.5 }
          }
          aria-hidden
        />
      ) : null}
      <span className="relative">{menu.label}</span>
    </>
  );

  if (!children?.length) {
    return (
      <Link
        href={menu.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-current={active ? "page" : undefined}
        className={linkClass}
      >
        {label}
      </Link>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-current={active ? "page" : undefined}
        className={cn(
          linkClass,
          "inline-flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {label}
        <ChevronDown className="relative size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      {menu.kind === "categories" ? (
        <CategoryMegaMenu
          menu={menu}
          pathname={pathname}
          activeCategory={activeCategory}
          copy={copy}
        />
      ) : (
        <DropdownMenuContent
          align="center"
          sideOffset={12}
          collisionPadding={16}
          className="w-[min(90vw,36rem)] rounded-2xl border-border bg-popover/95 p-3 text-popover-foreground shadow-[0_28px_90px_rgb(0_0_0/0.4)] backdrop-blur-xl"
        >
          <DropdownMenuItem asChild className="rounded-xl p-0">
            <Link
              href={menu.href}
              className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary outline-none transition hover:bg-primary/15"
            >
              <span>
                {interpolateChromeTemplate(
                  copy.shopAllTemplate,
                  { label: menu.label.toLowerCase() },
                  ["label"],
                )}
              </span>
              <span aria-hidden>→</span>
            </Link>
          </DropdownMenuItem>
          <div className="mt-2 grid max-h-[min(60vh,24rem)] grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
            {children.map((item) => (
              <DropdownMenuItem key={`${item.label}-${item.href}`} asChild className="rounded-xl p-0">
                <Link
                  href={item.href}
                  {...(isExternalChromeHref(item.href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex min-h-16 flex-col justify-end rounded-xl border border-transparent bg-surface px-3 py-2.5 text-sm font-medium text-foreground outline-none transition hover:border-primary/30 hover:text-primary"
                >
                  <span>{item.label}</span>
                  {item.items?.length ? (
                    <span className="mt-0.5 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                      {interpolateChromeTemplate(
                        copy.collectionsCountTemplate,
                        { count: item.items.length },
                        ["count"],
                      )}
                    </span>
                  ) : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

function VoltIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full text-foreground/75 transition-all duration-200 hover:bg-foreground/[0.07] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function VoltIconLink({
  href,
  label,
  count,
  countOverflowLabel,
  active,
  children,
}: {
  href: string;
  label: string;
  count: number;
  countOverflowLabel: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-foreground/75 transition-all duration-200 hover:bg-foreground/[0.07] hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-primary",
      )}
    >
      {children}
      {count > 0 ? (
        <VoltCountBadge count={count} countOverflowLabel={countOverflowLabel} />
      ) : null}
    </Link>
  );
}

function VoltCartButton({
  href,
  label,
  count,
  countOverflowLabel,
  active,
}: {
  href: string;
  label: string;
  count: number;
  countOverflowLabel: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4",
        active || count > 0
          ? "bg-primary text-primary-foreground shadow-[0_8px_28px_-10px_rgb(var(--primary-rgb)/0.7)]"
          : "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.12]",
      )}
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">
        {count > 0 ? (
          <span>
            {count > 9 ? countOverflowLabel : count} in bag
          </span>
        ) : (
          "Bag"
        )}
      </span>
      <span className="sm:hidden">
        {count > 0 ? (count > 9 ? countOverflowLabel : count) : ""}
      </span>
    </Link>
  );
}

function VoltCountBadge({
  count,
  countOverflowLabel,
}: {
  count: number;
  countOverflowLabel: string;
}) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
      {count > 9 ? countOverflowLabel : count}
    </span>
  );
}