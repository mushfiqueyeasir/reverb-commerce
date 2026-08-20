"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Grid2X2 } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  isExternalChromeHref,
  isSafeChromeHref,
  type FooterCopy,
} from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { MenuLink, MenuType } from "@/type/menyType";

interface KawaiiCategoriesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuData: MenuType[];
  pathname: string;
  activeCategory: string | null;
  title: string;
  description: string;
  socials?: Record<string, string>;
  socialCopy?: FooterCopy;
}

function isCategoryActive(
  item: MenuLink,
  activeCategory: string | null,
): boolean {
  if (!activeCategory) return false;
  try {
    return item.href.includes(`category=${encodeURIComponent(activeCategory)}`);
  } catch {
    return false;
  }
}

function CategoryThumb({
  item,
  className,
}: {
  item: MenuLink;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          fill
          sizes="40px"
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

export default function KawaiiCategoriesDrawer({
  open,
  onOpenChange,
  menuData,
  pathname,
  activeCategory,
  title,
  description,
  socials,
  socialCopy,
}: KawaiiCategoriesDrawerProps) {
  const [expandedHref, setExpandedHref] = useState<string | null>(null);
  const groups = menuData
    .filter((menu) => menu.kind === "categories")
    .flatMap((menu) => menu.items ?? []);
  const allProducts = groups.find((item) => item.isDefault);
  const parents = groups.filter((item) => !item.isDefault);

  useEffect(() => {
    if (open) setExpandedHref(null);
  }, [open]);

  const socialLinks = socials && socialCopy
    ? [
        {
          id: "facebook",
          label: socialCopy.facebookAriaLabel,
          href: socials.facebook,
          icon: <FacebookIcon className="size-4" size={16} />,
        },
        {
          id: "instagram",
          label: socialCopy.instagramAriaLabel,
          href: socials.instagram,
          icon: <InstagramIcon className="size-4" size={16} />,
        },
        {
          id: "twitter",
          label: socialCopy.twitterAriaLabel,
          href: socials.twitter,
          icon: <TwitterIcon className="size-4" size={16} />,
        },
        {
          id: "youtube",
          label: socialCopy.youtubeAriaLabel,
          href: socials.youtube,
          icon: <YoutubeIcon className="size-4" size={16} />,
        },
      ].filter(
        (
          social,
        ): social is {
          id: string;
          label: string;
          href: string;
          icon: React.JSX.Element;
        } =>
          Boolean(
            social.href &&
              isSafeChromeHref(social.href) &&
              isExternalChromeHref(social.href),
          ),
      )
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-[min(84vw,20rem)] flex-col gap-0 overflow-hidden border-r border-border bg-background p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-5 pr-16 pt-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary-readable">
            Collections
          </p>
          <SheetTitle className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <nav aria-label={title} className="p-3">
            {allProducts ? (
              <Link
                href={allProducts.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  isActivePath(pathname, allProducts.href)
                    ? "bg-primary/10 text-primary-readable"
                    : "text-foreground hover:bg-surface",
                )}
              >
                <span className="grid size-10 place-items-center rounded-xl border border-border bg-primary/10 text-primary-readable">
                  <Grid2X2 className="size-4" />
                </span>
                {allProducts.label}
              </Link>
            ) : null}

            {parents.map((parent) => {
              const active = isCategoryActive(parent, activeCategory);
              const expanded = expandedHref === parent.href;
              return (
                <div
                  key={parent.href}
                  className="mb-1.5 overflow-hidden rounded-2xl border border-border bg-surface/50"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={parent.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 px-3 py-3 transition",
                        active
                          ? "text-primary-readable"
                          : "text-foreground hover:text-primary-readable",
                      )}
                    >
                      <CategoryThumb item={parent} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {parent.label}
                      </span>
                    </Link>
                    {parent.items?.length ? (
                      <button
                        type="button"
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${parent.label}`}
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedHref(expanded ? null : parent.href)
                        }
                        className="mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-primary-readable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div className="space-y-0.5 border-t border-border bg-background px-3 py-2">
                      <Link
                        href={parent.href}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition hover:text-primary-readable"
                      >
                        View all {parent.label}
                      </Link>
                      {parent.items?.map((child) => {
                        const childActive = isCategoryActive(
                          child,
                          activeCategory,
                        );
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => onOpenChange(false)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                              childActive
                                ? "bg-primary/10 font-semibold text-primary-readable"
                                : "text-muted-foreground hover:bg-surface hover:text-foreground",
                            )}
                          >
                            <CategoryThumb
                              item={child}
                              className="size-7 rounded-lg"
                            />
                            <span className="min-w-0 truncate">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {socialLinks.length ? (
          <div className="shrink-0 border-t border-border px-5 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              Follow us
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-10 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}