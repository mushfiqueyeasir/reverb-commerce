"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { navItemsForRole, NAV_GROUPS, type NavItem } from "@/lib/admin/nav";
import { Icon } from "./Icon";
import { AdminProvider, type AdminContextValue } from "./AdminContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAdmin } from "@/app/admin/auth-audit-actions";
import { AdminScrollArea } from "./AdminScrollArea";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

const NAV_GROUPS_STORAGE_KEY = "ve-admin-nav-groups";

function defaultOpenGroups(): Record<NavItem["group"], boolean> {
  return {
    Overview: true,
    Catalog: true,
    Sales: true,
    Content: true,
    Store: true,
  };
}

function readOpenGroups(): Record<NavItem["group"], boolean> {
  const defaults = defaultOpenGroups();
  try {
    const raw = localStorage.getItem(NAV_GROUPS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<
      Record<NavItem["group"], boolean>
    >;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

type OpenGroups = Record<NavItem["group"], boolean>;

function AdminNavList({
  compact,
  items,
  activeHref,
  openGroups,
  onToggleGroup,
  onNavigate,
}: {
  compact: boolean;
  items: NavItem[];
  activeHref: string | null;
  openGroups: OpenGroups;
  onToggleGroup: (group: NavItem["group"]) => void;
  onNavigate: () => void;
}) {
  return (
    <AdminScrollArea className="min-h-0 flex-1">
      <nav className="space-y-5 px-3 py-5">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          const isOpen = compact || openGroups[group];

          return (
            <div key={group}>
              {!compact && (
                <button
                  type="button"
                  onClick={() => onToggleGroup(group)}
                  aria-expanded={isOpen}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition hover:bg-foreground/5"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {group}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      isOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
              )}
              {isOpen ? (
                <div className="space-y-0.5">
                  {groupItems.map((item) => {
                    const active = activeHref === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        title={compact ? item.label : undefined}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-foreground/5 hover:text-foreground",
                          compact && "justify-center px-2",
                        )}
                      >
                        <Icon name={item.icon} className="size-4 shrink-0" />
                        {!compact && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </AdminScrollArea>
  );
}

function AdminSidebar({
  compact,
  items,
  activeHref,
  openGroups,
  onToggleGroup,
  onNavigate,
  storeName,
  logoUrl,
  faviconUrl,
}: {
  compact: boolean;
  items: NavItem[];
  activeHref: string | null;
  openGroups: OpenGroups;
  onToggleGroup: (group: NavItem["group"]) => void;
  onNavigate: () => void;
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4",
          compact && "justify-center px-2",
        )}
      >
        {compact && (faviconUrl || logoUrl) ? (
          <Image
            src={faviconUrl || logoUrl!}
            alt={storeName}
            width={64}
            height={64}
            className="size-7"
          />
        ) : !compact && logoUrl ? (
          <div>
            <Image
              src={logoUrl}
              alt={storeName}
              width={400}
              height={160}
              className="h-6 w-auto"
            />
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Admin
            </p>
          </div>
        ) : (
          <div className={cn(compact && "text-center")}>
            <p className="truncate font-display text-sm font-bold text-foreground">
              {compact ? storeName.charAt(0).toUpperCase() || "S" : storeName}
            </p>
            {!compact ? (
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Admin
              </p>
            ) : null}
          </div>
        )}
      </div>
      <AdminNavList
        compact={compact}
        items={items}
        activeHref={activeHref}
        openGroups={openGroups}
        onToggleGroup={onToggleGroup}
        onNavigate={onNavigate}
      />
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground",
            compact && "justify-center px-2",
          )}
          title="View storefront"
        >
          <ExternalLink className="size-4 shrink-0" />
          {!compact && <span>View store</span>}
        </Link>
      </div>
    </div>
  );
}

export default function AdminShell({
  session,
  storeName,
  logoUrl,
  faviconUrl,
  children,
}: {
  session: AdminContextValue;
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] =
    useState<Record<NavItem["group"], boolean>>(defaultOpenGroups);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("ve-admin-collapsed") === "1");
    setOpenGroups(readOpenGroups());
    setNavReady(true);
  }, []);

  useEffect(() => {
    if (!navReady) return;
    localStorage.setItem("ve-admin-collapsed", collapsed ? "1" : "0");
  }, [collapsed, navReady]);

  useEffect(() => {
    if (!navReady) return;
    localStorage.setItem(NAV_GROUPS_STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups, navReady]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const items = navItemsForRole(session.role);
  const activeItem =
    items
      .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null;

  useEffect(() => {
    if (!activeItem) return;
    setOpenGroups((prev) =>
      prev[activeItem.group] ? prev : { ...prev, [activeItem.group]: true },
    );
  }, [activeItem]);

  const toggleGroup = (group: NavItem["group"]) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const signOut = async () => {
    const result = await signOutAdmin();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Signed out");
    window.location.assign("/admin/login");
  };

  return (
    <AdminProvider value={session}>
      <div className="flex h-svh overflow-hidden bg-background text-foreground">
        <aside
          className={cn(
            "hidden h-full shrink-0 border-r border-sidebar-border transition-[width] duration-200 ease-out lg:block",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <AdminSidebar
            compact={collapsed}
            items={items}
            activeHref={activeItem?.href ?? null}
            openGroups={openGroups}
            onToggleGroup={toggleGroup}
            onNavigate={() => setMobileOpen(false)}
            storeName={storeName}
            logoUrl={logoUrl}
            faviconUrl={faviconUrl}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl">
              <AdminSidebar
                compact={false}
                items={items}
                activeHref={activeItem?.href ?? null}
                openGroups={openGroups}
                onToggleGroup={toggleGroup}
                onNavigate={() => setMobileOpen(false)}
                storeName={storeName}
                logoUrl={logoUrl}
                faviconUrl={faviconUrl}
              />
              <button
                type="button"
                className="absolute right-2 top-2 grid size-11 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:gap-3 sm:px-4 lg:px-6">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <button
              type="button"
              className="hidden size-11 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground lg:grid"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <ChevronLeft className="size-5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="hidden sm:inline">Admin</span>
                {activeItem && (
                  <>
                    <span
                      aria-hidden
                      className="hidden size-1 rounded-full bg-muted-foreground/50 sm:inline-block"
                    />
                    <span className="truncate text-foreground">
                      {activeItem.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm transition hover:border-primary/40">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {(session.fullName || session.email)
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-35 truncate font-medium leading-tight">
                      {session.fullName || session.email}
                    </span>
                    <span className="block text-[11px] leading-tight text-muted-foreground">
                      {ROLE_LABEL[session.role]}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-border bg-card"
              >
                <DropdownMenuLabel>
                  <div className="truncate">{session.email}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {ROLE_LABEL[session.role]}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-primary focus:text-primary"
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <AdminScrollArea className="min-h-0 flex-1">
            <main className="admin-content relative p-4 lg:p-8">
              {children}
            </main>
          </AdminScrollArea>
        </div>
      </div>
    </AdminProvider>
  );
}
