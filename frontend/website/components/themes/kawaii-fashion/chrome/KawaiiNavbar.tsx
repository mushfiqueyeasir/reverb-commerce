"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Heart,
  Home,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
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
import type { MenuLink, MenuType } from "@/type/menyType";

interface KawaiiNavbarProps {
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

export default function KawaiiNavbar({
  menuData,
  logoUrl,
  storeName,
  copy,
  announcementText,
  announcementActive = false,
  announcementUrl,
  aiSearchEnabled = false,
  preview = false,
}: KawaiiNavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<"search" | "advisor">("search");
  const activeCategory = searchParams.get("category")?.trim() || null;
  const menus = menuData.filter((menu): menu is MenuType & { href: string } =>
    Boolean(menu.href && isSafeChromeHref(menu.href)),
  );
  const showAnnouncement = Boolean(
    announcementActive && announcementText?.trim(),
  );

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
          "z-50 text-foreground md:border-b md:border-border md:bg-background",
          preview
            ? "relative overflow-hidden md:border [&_a]:pointer-events-none [&_button]:pointer-events-none"
            : "relative md:sticky md:inset-x-0 md:top-0",
        )}
      >
        {showAnnouncement ? (
          <Announcement
            text={announcementText!.trim()}
            href={announcementUrl}
          />
        ) : null}
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 items-center md:hidden">
            <Brand
              logoUrl={logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={copy.homeLinkAriaLabelTemplate}
              compact
            />
          </div>

          <div className="hidden h-20 grid-cols-[minmax(10rem,1fr)_minmax(0,2fr)_minmax(10rem,1fr)] items-center gap-6 md:grid">
            <Brand
              logoUrl={logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={copy.homeLinkAriaLabelTemplate}
            />
            <nav
              aria-label={copy.primaryNavigationAriaLabel}
              className="flex min-w-0 items-center justify-center gap-5 overflow-x-auto [scrollbar-width:none] lg:gap-8 [&::-webkit-scrollbar]:hidden"
            >
              {menus.map((menu) => (
                <DesktopMenu
                  key={`${menu.kind}-${menu.label}-${menu.href}`}
                  menu={menu}
                  pathname={pathname}
                  activeCategory={activeCategory}
                  copy={copy}
                />
              ))}
            </nav>
            <div className="flex items-center justify-end gap-1">
              <ActionButton
                label={copy.desktopSearchAriaLabel}
                onClick={openSearch}
              >
                <Search className="size-[1.125rem]" />
              </ActionButton>
              <ActionLink
                href="/wishlist"
                label={copy.desktopFavoritesAriaLabel}
                count={wishlistCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/wishlist")}
              >
                <Heart
                  className={cn(
                    "size-[1.125rem]",
                    wishlistCount > 0 && "fill-current",
                  )}
                />
              </ActionLink>
              <ActionLink
                href="/cart"
                label={copy.desktopBagAriaLabel}
                count={itemCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/cart")}
              >
                <ShoppingBag className="size-[1.125rem]" />
              </ActionLink>
            </div>
          </div>
        </div>
      </header>

      {!preview ? (
        <>
          <KawaiiMobileBottomNav
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

function Announcement({ text, href }: { text: string; href?: string | null }) {
  const safeHref = href?.trim() && isSafeChromeHref(href) ? href.trim() : null;
  const content = (
    <span className="inline-flex items-center justify-center gap-2">
      <Sparkles className="size-3.5" aria-hidden />
      <span>{text}</span>
      {safeHref ? <span aria-hidden>→</span> : null}
    </span>
  );

  return (
    <div className="hidden min-h-8 items-center justify-center border-b border-primary/15 bg-primary/10 px-4 py-1 text-center text-xs font-medium tracking-[0.08em] text-foreground md:flex">
      {safeHref ? (
        <Link href={safeHref} {...externalLinkProps(safeHref)}>
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

function Brand({
  logoUrl,
  storeName,
  homeLinkAriaLabelTemplate,
  compact = false,
}: {
  logoUrl: string | null;
  storeName: string;
  homeLinkAriaLabelTemplate: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={interpolateChromeTemplate(
        homeLinkAriaLabelTemplate,
        { storeName },
        ["storeName"],
      )}
      className="flex min-w-0 items-center"
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={storeName}
          width={160}
          height={44}
          priority
          className={cn("w-auto object-contain", compact ? "h-7" : "h-9")}
        />
      ) : (
        <span
          className={cn(
            "truncate font-display font-semibold tracking-[-0.04em] text-foreground",
            compact ? "max-w-44 text-xl" : "max-w-64 text-2xl",
          )}
        >
          {storeName}
        </span>
      )}
    </Link>
  );
}

function DesktopMenu({
  menu,
  pathname,
  activeCategory,
  copy,
}: {
  menu: MenuType;
  pathname: string;
  activeCategory: string | null;
  copy: NavbarCopy;
}) {
  const external = isExternalChromeHref(menu.href);
  const active = !external && isActivePath(pathname, menu.href);
  const className = cn(
    "relative shrink-0 whitespace-nowrap py-2 text-xs font-semibold uppercase tracking-[0.14em] transition after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-center after:bg-primary after:transition-transform",
    active
      ? "text-primary-readable after:scale-x-100"
      : "text-foreground/75 after:scale-x-0 hover:text-primary-readable hover:after:scale-x-100",
  );
  const children = menu.items?.filter((item) => isSafeChromeHref(item.href));

  if (!children?.length) {
    return (
      <Link
        href={menu.href}
        {...externalLinkProps(menu.href)}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {menu.label}
      </Link>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-current={active ? "page" : undefined}
        className={cn(className, "inline-flex items-center gap-1 outline-none")}
      >
        {menu.label}
        <ChevronDown className="size-3.5" />
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
          sideOffset={14}
          collisionPadding={16}
          className="w-[min(90vw,38rem)] rounded-2xl border-border bg-background p-3 text-foreground shadow-lg"
        >
          <DropdownMenuItem asChild className="rounded-xl p-0">
            <Link
              href={menu.href}
              className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary-readable outline-none transition hover:bg-primary/15"
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
              <CategoryLink
                key={`${item.label}-${item.href}`}
                item={item}
                collectionsCountTemplate={copy.collectionsCountTemplate}
              />
            ))}
          </div>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

function CategoryLink({
  item,
  collectionsCountTemplate,
}: {
  item: MenuLink;
  collectionsCountTemplate: string;
}) {
  return (
    <DropdownMenuItem asChild className="rounded-xl p-0">
      <Link
        href={item.href}
        {...externalLinkProps(item.href)}
        className="group flex min-h-20 flex-col justify-end rounded-xl border border-transparent bg-surface px-3 py-3 text-sm font-medium text-foreground outline-none transition hover:border-primary/30 hover:text-primary-readable"
      >
        <span>{item.label}</span>
        {item.items?.length ? (
          <span className="mt-1 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
            {interpolateChromeTemplate(
              collectionsCountTemplate,
              { count: item.items.length },
              ["count"],
            )}
          </span>
        ) : null}
      </Link>
    </DropdownMenuItem>
  );
}

function ActionButton({
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
      className="grid size-10 place-items-center rounded-full text-foreground/75 transition hover:bg-surface hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

function ActionLink({
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
        "relative grid size-10 place-items-center rounded-full transition hover:bg-surface hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-primary-readable" : "text-foreground/75",
      )}
    >
      {children}
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-[9999px] bg-primary px-1 text-[9px] font-bold text-primary-foreground">
          {count > 9 ? countOverflowLabel : count}
        </span>
      ) : null}
    </Link>
  );
}

function KawaiiMobileBottomNav({
  pathname,
  itemCount,
  wishlistCount,
  onSearchOpen,
  copy,
}: {
  pathname: string;
  itemCount: number;
  wishlistCount: number;
  onSearchOpen: () => void;
  copy: NavbarCopy;
}) {
  return (
    <nav
      aria-label={copy.mobileNavigationAriaLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        <MobileTab
          href="/"
          label={copy.mobileHomeLabel}
          active={isActivePath(pathname, "/")}
          countOverflowLabel={copy.countOverflowLabel}
          icon={<Home className="size-5" />}
        />
        <MobileTab
          href="/wishlist"
          label={copy.mobileSavedLabel}
          active={isActivePath(pathname, "/wishlist")}
          count={wishlistCount}
          countOverflowLabel={copy.countOverflowLabel}
          icon={<Heart className="size-5" />}
        />
        <MobileTab
          href="/product"
          label={copy.mobileShopLabel}
          active={isActivePath(pathname, "/product")}
          countOverflowLabel={copy.countOverflowLabel}
          featured
          icon={<Store className="size-7" />}
        />
        <MobileTab
          href="/cart"
          label={copy.mobileBagLabel}
          active={isActivePath(pathname, "/cart")}
          count={itemCount}
          countOverflowLabel={copy.countOverflowLabel}
          icon={<ShoppingBag className="size-5" />}
        />
        <button
          type="button"
          aria-label={copy.mobileSearchAriaLabel}
          onClick={onSearchOpen}
          className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground transition active:text-primary-readable"
        >
          <Search className="size-5" />
          <span className="text-[10px] font-medium">
            {copy.mobileSearchLabel}
          </span>
        </button>
      </div>
    </nav>
  );
}

function MobileTab({
  href,
  label,
  active,
  icon,
  count = 0,
  countOverflowLabel,
  featured = false,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  count?: number;
  countOverflowLabel: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition",
        active
          ? "text-primary-readable"
          : "text-muted-foreground active:text-primary-readable",
      )}
    >
      <span
        className={cn(
          "relative grid place-items-center",
          featured &&
            "-mt-7 size-16 rounded-full border-4 border-background bg-primary text-primary-foreground shadow-md",
        )}
      >
        {icon}
        {count > 0 ? (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-[9999px] bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {count > 9 ? countOverflowLabel : count}
          </span>
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function externalLinkProps(href: string) {
  return isExternalChromeHref(href)
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}
