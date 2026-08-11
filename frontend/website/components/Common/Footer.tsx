"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import {
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import type { SiteSettings } from "@/utility/getSettings";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface FooterProps {
  settings: SiteSettings;
}

type FooterLink = { label: string; href: string };

export default function Footer({ settings }: FooterProps) {
  const pathname = usePathname();
  const storeName = settings.store_name || "Store";
  const year = new Date().getFullYear();
  const socials = settings.socials ?? {};

  const shopLinks: FooterLink[] = [
    { label: "All products", href: "/product" },
    { label: "Favorites", href: "/wishlist" },
    { label: "Cart", href: "/cart" },
  ];

  const supportLinks: FooterLink[] = [
    { label: "Track order", href: "/track-order" },
    { label: "Shipping & returns", href: "/refund-policy" },
    { label: "Contact", href: "/contact-us" },
  ];

  const brandLinks: FooterLink[] = [
    { label: "About", href: "/about-us" },
    { label: "Reviews", href: "/reviews" },
  ];

  const legalLinks: FooterLink[] = [
    { label: "Terms of service", href: "/terms-of-service" },
    { label: "Privacy policy", href: "/privacy-policy" },
    { label: "Shipping & returns", href: "/refund-policy" },
  ];

  const socialLinks = [
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
  ].filter((s) => Boolean(s.href && s.href !== "#"));

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
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

      <div className="relative mx-auto max-w-[1600px] px-6 pb-10 pt-16 md:px-10 md:pb-12 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_repeat(4,1fr)] lg:gap-10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
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
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Browse products, discover new arrivals, and shop securely online.
            </p>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              {settings.contact_email ? (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="flex items-center gap-2 transition hover:text-primary"
                >
                  <Mail className="size-3.5 shrink-0" />
                  {settings.contact_email}
                </a>
              ) : null}
              {settings.contact_phone ? (
                <a
                  href={`tel:${settings.contact_phone}`}
                  className="flex items-center gap-2 transition hover:text-primary"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {settings.contact_phone}
                </a>
              ) : null}
            </div>

            {socialLinks.length > 0 ? (
              <div className="mt-6 flex gap-2">
                {socialLinks.map((s) => (
                  <Social
                    key={s.key}
                    href={s.href!}
                    icon={s.icon}
                    label={s.label}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <Col title="Shop" items={shopLinks} pathname={pathname} />
          <Col title="Support" items={supportLinks} pathname={pathname} />
          <Col title="Brand" items={brandLinks} pathname={pathname} />
          <Col title="Legal" items={legalLinks} pathname={pathname} />
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {storeName}
          </span>
          <Link
            href="https://www.reverbsolution.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="self-end transition hover:text-primary sm:self-auto"
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
}: {
  title: string;
  items: FooterLink[];
  pathname: string;
}) {
  return (
    <div>
      <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-3">
        {items.map((i) => {
          const active = isActivePath(pathname, i.href);
          return (
            <li key={`${i.label}-${i.href}`}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm transition",
                  active
                    ? "font-medium text-primary"
                    : "text-foreground/80 hover:text-primary",
                )}
              >
                {i.label}
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
