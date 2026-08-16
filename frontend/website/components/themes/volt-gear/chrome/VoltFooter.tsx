"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, Phone, Zap } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import {
  interpolateChromeTemplate,
  isExternalChromeHref,
  type FooterLink,
} from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/utility/getSettings";

type VoltFooterSettings = Pick<
  SiteSettings,
  | "store_name"
  | "socials"
  | "footer"
  | "logoUrl"
  | "contact_email"
  | "contact_phone"
>;

interface VoltFooterProps {
  settings: VoltFooterSettings;
  preview?: boolean;
}

export default function VoltFooter({
  settings,
  preview = false,
}: VoltFooterProps) {
  const pathname = usePathname();
  const storeName = settings.store_name || "Store";
  const year = new Date().getFullYear();
  const socials = settings.socials ?? {};
  const config = settings.footer;
  const columns = [
    ...config.columns,
    ...(config.legalLinks.length
      ? [{ id: "legal", title: "Legal", links: config.legalLinks }]
      : []),
  ];
  const socialLinks = [
    {
      key: "facebook",
      href: socials.facebook,
      icon: <FacebookIcon className="h-4 w-4" size={16} />,
      label: config.copy.facebookAriaLabel,
    },
    {
      key: "instagram",
      href: socials.instagram,
      icon: <InstagramIcon className="h-4 w-4" size={16} />,
      label: config.copy.instagramAriaLabel,
    },
    {
      key: "twitter",
      href: socials.twitter,
      icon: <TwitterIcon className="h-4 w-4" size={16} />,
      label: config.copy.twitterAriaLabel,
    },
    {
      key: "youtube",
      href: socials.youtube,
      icon: <YoutubeIcon className="h-4 w-4" size={16} />,
      label: config.copy.youtubeAriaLabel,
    },
  ].filter((item) => Boolean(item.href && item.href !== "#"));

  return (
    <footer
      className={cn(
        "relative border-t border-border bg-background",
        preview && "rounded-xl border [&_a]:pointer-events-none",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <div className="mx-auto max-w-[1600px] px-5 pb-10 pt-16 sm:px-6 md:px-10 md:pb-14 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label={interpolateChromeTemplate(
                config.copy.homeLinkAriaLabelTemplate,
                { storeName },
                ["storeName"],
              )}
              className="inline-flex items-center gap-2.5"
            >
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={storeName}
                  width={140}
                  height={36}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Zap className="size-4" fill="currentColor" />
                  </span>
                  <span className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
                    {storeName}
                  </span>
                </span>
              )}
            </Link>

            {config.description ? (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {config.description}
              </p>
            ) : null}

            {settings.contact_email || settings.contact_phone ? (
              <div className="mt-7 space-y-2.5 text-sm text-muted-foreground">
                {settings.contact_email ? (
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary-readable"
                  >
                    <Mail className="size-4 shrink-0" />
                    {settings.contact_email}
                  </a>
                ) : null}
                {settings.contact_phone ? (
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-primary-readable"
                  >
                    <Phone className="size-4 shrink-0" />
                    {settings.contact_phone}
                  </a>
                ) : null}
              </div>
            ) : null}

            {socialLinks.length > 0 ? (
              <div className="mt-7 flex gap-2.5">
                {socialLinks.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {columns.length ? (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {columns.map((column) => (
                <div key={column.id}>
                  <h2 className="mb-4 text-sm font-semibold tracking-[-0.01em] text-foreground">
                    {column.title}
                  </h2>
                  <ul className="space-y-3">
                    {column.links.map((item) => (
                      <VoltFooterLink
                        key={item.id}
                        item={item}
                        pathname={pathname}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {interpolateChromeTemplate(
              config.copy.copyrightTemplate,
              { year, storeName },
              ["year", "storeName"],
            )}
          </span>
          <Link
            href="https://www.reverbsolution.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start transition-colors hover:text-primary-readable sm:self-auto"
          >
            Developed by Reverb Solution
          </Link>
        </div>
      </div>
    </footer>
  );
}

function VoltFooterLink({
  item,
  pathname,
}: {
  item: FooterLink;
  pathname: string;
}) {
  const active = item.href.startsWith("/") && isActivePath(pathname, item.href);
  const external = isExternalChromeHref(item.href);
  return (
    <li>
      <Link
        href={item.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "text-sm transition-all duration-200",
          active
            ? "font-medium text-primary-readable"
            : "text-muted-foreground hover:translate-x-0.5 hover:text-foreground",
        )}
      >
        {item.label}
      </Link>
    </li>
  );
}
