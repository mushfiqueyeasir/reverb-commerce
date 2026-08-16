"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import type { SiteSettings } from "@/utility/getSettings";
import type { FooterConfig, FooterLink } from "@/lib/cms/siteChrome";
import { isExternalChromeHref } from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

type FooterSettings = Pick<
  SiteSettings,
  | "store_name"
  | "socials"
  | "footer"
  | "logoUrl"
  | "contact_email"
  | "contact_phone"
>;

interface FooterProps {
  settings: FooterSettings;
  preview?: boolean;
}

export function FooterPreview({ config }: { config: FooterConfig }) {
  return (
    <Footer
      preview
      settings={{
        store_name: "Your Store",
        socials: {
          facebook: "https://example.com",
          instagram: "https://example.com",
          twitter: "https://example.com",
        },
        footer: config,
        logoUrl: null,
        contact_email: "hello@yourstore.com",
        contact_phone: "+880 1000-000000",
      }}
    />
  );
}

export default function Footer({ settings, preview = false }: FooterProps) {
  const pathname = usePathname();
  const storeName = settings.store_name || "Store";
  const year = new Date().getFullYear();
  const socials = settings.socials ?? {};
  const config = settings.footer;
  const compact = config.variant === "compact";
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
      label: "Facebook",
    },
    {
      key: "instagram",
      href: socials.instagram,
      icon: <InstagramIcon className="h-4 w-4" size={16} />,
      label: "Instagram",
    },
    {
      key: "twitter",
      href: socials.twitter,
      icon: <TwitterIcon className="h-4 w-4" size={16} />,
      label: "X",
    },
    {
      key: "youtube",
      href: socials.youtube,
      icon: <YoutubeIcon className="h-4 w-4" size={16} />,
      label: "YouTube",
    },
  ].filter((item) => Boolean(item.href && item.href !== "#"));

  const identity = (
    <div className={cn("max-w-sm", compact && "mx-auto text-center")}>
      <Link
        href="/"
        className={cn(
          "inline-flex items-center gap-3",
          compact && "justify-center",
        )}
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
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {storeName}
          </span>
        )}
      </Link>
      {config.description ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {config.description}
        </p>
      ) : null}
      {settings.contact_email || settings.contact_phone ? (
        <div
          className={cn(
            "mt-6 space-y-2 text-sm text-muted-foreground",
            compact &&
              "flex flex-wrap justify-center gap-x-5 gap-y-2 space-y-0",
          )}
        >
          {settings.contact_email ? (
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-center gap-2 transition hover:text-primary-readable"
            >
              <Mail className="size-3.5 shrink-0" />
              {settings.contact_email}
            </a>
          ) : null}
          {settings.contact_phone ? (
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex items-center gap-2 transition hover:text-primary-readable"
            >
              <Phone className="size-3.5 shrink-0" />
              {settings.contact_phone}
            </a>
          ) : null}
        </div>
      ) : null}
      {socialLinks.length > 0 ? (
        <div className={cn("mt-6 flex gap-2", compact && "justify-center")}>
          {socialLinks.map((item) => (
            <Social
              key={item.key}
              href={item.href!}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <footer
      className={cn(
        "relative overflow-hidden border-t border-border bg-background",
        preview && "rounded-xl border [&_a]:pointer-events-none",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.18) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div
        className={cn(
          "relative mx-auto max-w-[1600px] px-6 pb-10 md:px-10 md:pb-12",
          compact ? "pt-12 md:pt-14" : "pt-16 md:pt-20",
        )}
      >
        {compact ? (
          <div>
            {identity}
            {columns.length ? (
              <div className="mt-12 grid gap-8 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
                {columns.map((column) => (
                  <Col
                    key={column.id}
                    title={column.title}
                    items={column.links}
                    pathname={pathname}
                    compact
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-10">
            {identity}
            {columns.map((column) => (
              <Col
                key={column.id}
                title={column.title}
                items={column.links}
                pathname={pathname}
              />
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {storeName}
          </span>
          <Link
            href="https://www.reverbsolution.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-end transition hover:text-primary-readable sm:self-auto"
          >
            Developed by Reverb Solution
          </Link>
        </div>
      </div>
    </footer>
  );
}

function Col({
  title,
  items,
  pathname,
  compact = false,
}: {
  title: string;
  items: FooterLink[];
  pathname: string;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact && "text-center sm:text-left")}>
      <h2 className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const active =
            item.href.startsWith("/") && isActivePath(pathname, item.href);
          const external = isExternalChromeHref(item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm transition",
                  active
                    ? "font-medium text-primary-readable"
                    : "text-foreground/80 hover:text-primary-readable",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Social({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
    >
      {icon}
    </Link>
  );
}
