"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Heart,
  Home,
  Menu,
  Search,
  ShoppingBag,
  Store,
  X,
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

interface ZaroNavbarProps {
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

export default function ZaroNavbar({
  menuData,
  logoUrl,
  storeName,
  copy,
  announcementText,
  announcementActive = false,
  announcementUrl,
  aiSearchEnabled = false,
  preview = false,
}: ZaroNavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTab, setSearchTab] = useState<"search" | "advisor">("search");
  const [mobileOpen, setMobileOpen] = useState(false);
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
          "z-50 text-[#1f1f1b]",
          preview
            ? "relative overflow-hidden border-b border-[#dedad9] bg-[#f9f5f3] [&_a]:pointer-events-none [&_button]:pointer-events-none"
            : "relative bg-[#f9f5f3] md:sticky md:inset-x-0 md:top-0",
        )}
      >
        {showAnnouncement ? (
          <div className="bg-[#1f1f1b] px-6 py-2 text-center text-[13px] font-normal text-white sm:px-10">
            {announcementUrl?.trim() && isSafeChromeHref(announcementUrl) ? (
              <Link href={announcementUrl} className="hover:opacity-85">
                {announcementText!.trim()}{" "}
                <span className="underline underline-offset-4">
                  Terms apply
                </span>
              </Link>
            ) : (
              <span>{announcementText!.trim()}</span>
            )}
          </div>
        ) : null}
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
          <div className="flex h-16 items-center justify-between md:hidden">
            <Brand
              logoUrl={logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={copy.homeLinkAriaLabelTemplate}
              compact
            />
            <div className="flex items-center gap-1">
              <ActionButton
                label={copy.desktopSearchAriaLabel}
                onClick={openSearch}
              >
                <Search className="size-5" />
              </ActionButton>
              <ActionLink
                href="/cart"
                label={copy.desktopBagAriaLabel}
                count={itemCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/cart")}
              >
                <ShoppingBag className="size-5" />
              </ActionLink>
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((current) => !current)}
                className="grid size-10 place-items-center rounded-full transition hover:bg-[#e8e3e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b]"
              >
                {mobileOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="hidden h-[72px] grid-cols-[minmax(10rem,1fr)_minmax(0,2fr)_minmax(10rem,1fr)] items-center gap-6 md:grid">
            <Brand
              logoUrl={logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={copy.homeLinkAriaLabelTemplate}
            />
            <nav
              aria-label={copy.primaryNavigationAriaLabel}
              className="flex min-w-0 items-center justify-center gap-9 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                <Search className="size-5" />
              </ActionButton>
              <ActionLink
                href="/wishlist"
                label={copy.desktopFavoritesAriaLabel}
                count={wishlistCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/wishlist")}
              >
                <Heart
                  className={cn("size-5", wishlistCount > 0 && "fill-current")}
                />
              </ActionLink>
              <ActionLink
                href="/cart"
                label={copy.desktopBagAriaLabel}
                count={itemCount}
                countOverflowLabel={copy.countOverflowLabel}
                active={isActivePath(pathname, "/cart")}
              >
                <ShoppingBag className="size-5" />
              </ActionLink>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && !preview ? (
        <MobileMenu
          menus={menus}
          pathname={pathname}
          onClose={() => setMobileOpen(false)}
          copy={copy}
        />
      ) : null}

      {!preview ? (
        <>
          <ZaroMobileBottomNav
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
          height={40}
          priority
          className={cn("w-auto object-contain", compact ? "h-6" : "h-8")}
        />
      ) : (
        <span
          className={cn(
            "truncate font-display font-semibold tracking-[0.08em] text-[#1f1f1b]",
            compact ? "max-w-40 text-xl" : "max-w-64 text-2xl",
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
    "relative shrink-0 whitespace-nowrap py-2 text-[13px] font-normal tracking-[0.02em] transition-colors",
    active
      ? "text-[#1f1f1b] underline decoration-[#1f1f1b] underline-offset-8"
      : "text-[#1f1f1b] hover:text-[#7e796a]",
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
          className="w-[min(90vw,38rem)] rounded-[16px] border-[#dedad9] bg-white p-3 text-[#1f1f1b] shadow-lg"
        >
          <DropdownMenuItem asChild className="rounded-xl p-0">
            <Link
              href={menu.href}
              className="flex items-center justify-between rounded-xl bg-[#f9f5f3] px-4 py-3 text-sm font-medium text-[#1f1f1b] outline-none transition hover:bg-[#e8e3e1]"
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
        className="group flex min-h-20 flex-col justify-end rounded-xl border border-transparent bg-[#f9f5f3] px-3 py-3 text-sm font-medium text-[#1f1f1b] outline-none transition hover:border-[#dedad9] hover:bg-white"
      >
        <span>{item.label}</span>
        {item.items?.length ? (
          <span className="mt-1 text-[10px] font-normal uppercase tracking-wider text-[#7e796a]">
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
      className="grid size-10 place-items-center rounded-full text-[#1f1f1b] transition hover:bg-[#e8e3e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b]"
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
        "relative grid size-10 place-items-center rounded-full transition hover:bg-[#e8e3e1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b]",
        active ? "text-[#1f1f1b]" : "text-[#1f1f1b]",
      )}
    >
      {children}
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ffc400] px-1 text-[9px] font-bold text-[#1f1f1b]">
          {count > 9 ? countOverflowLabel : count}
        </span>
      ) : null}
    </Link>
  );
}

function MobileMenu({
  menus,
  pathname,
  onClose,
  copy,
}: {
  menus: Array<MenuType & { href: string }>;
  pathname: string;
  onClose: () => void;
  copy: NavbarCopy;
}) {
  return (
    <nav
      aria-label={copy.mobileNavigationAriaLabel}
      className="fixed inset-0 z-[60] bg-white pt-24 md:hidden"
    >
      <div className="mx-auto max-w-md px-6 pb-16">
        <ul className="space-y-1">
          {menus.map((menu) => {
            const active = isActivePath(pathname, menu.href);
            const children = menu.items?.filter((item) =>
              isSafeChromeHref(item.href),
            );
            return (
              <li key={`${menu.kind}-${menu.label}-${menu.href}`}>
                <Link
                  href={menu.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between border-b border-[#dedad9] py-4 text-xl font-medium text-[#1f1f1b]",
                    active && "text-[#7e796a]",
                  )}
                >
                  {menu.label}
                  {children?.length ? <ChevronDown className="size-4" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/wishlist"
          onClick={onClose}
          className="mt-6 flex items-center gap-3 text-base font-medium text-[#1f1f1b]"
        >
          <Heart className="size-5" />
          {copy.mobileSavedLabel}
        </Link>
      </div>
    </nav>
  );
}

function ZaroMobileBottomNav({
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dedad9] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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
          className="flex h-full flex-col items-center justify-center gap-1 text-[#7e796a] transition active:text-[#1f1f1b]"
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
        active ? "text-[#1f1f1b]" : "text-[#7e796a] active:text-[#1f1f1b]",
      )}
    >
      <span
        className={cn(
          "relative grid place-items-center",
          featured &&
            "-mt-7 size-16 rounded-full border-4 border-background bg-[#1f1f1b] text-white shadow-md",
        )}
      >
        {icon}
        {count > 0 ? (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ffc400] px-1 text-[9px] font-bold text-[#1f1f1b]">
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
