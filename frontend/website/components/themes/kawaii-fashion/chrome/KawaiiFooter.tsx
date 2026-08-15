"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headphones,
  Heart,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import {
  isExternalChromeHref,
  isSafeChromeHref,
  type FooterColumn,
  type FooterLink,
} from "@/lib/cms/siteChrome";
import { isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/utility/getSettings";

export type KawaiiFooterSettings = Pick<
  SiteSettings,
  | "store_name"
  | "socials"
  | "footer"
  | "logoUrl"
  | "contact_email"
  | "contact_phone"
>;

export interface KawaiiFooterProps {
  settings: KawaiiFooterSettings;
  preview?: boolean;
}

export default function KawaiiFooter({
  settings,
  preview = false,
}: KawaiiFooterProps) {
  const pathname = usePathname();
  const storeName = settings.store_name || "Store";
  const config = settings.footer;
  const columns = config.columns
    .map((column) => ({
      ...column,
      links: column.links.filter((link) => isSafeChromeHref(link.href)),
    }))
    .filter((column) => column.links.length > 0);
  const legalLinks = config.legalLinks.filter((link) =>
    isSafeChromeHref(link.href),
  );
  const socialLinks = getSocialLinks(settings.socials);
  const newsletterHref = getContactHref(settings.contact_email, "email");
  const showSupportBlocks = !preview && pathname !== "/";

  return (
    <footer
      className={cn(
        "relative overflow-hidden border-t border-border bg-background text-foreground",
        preview && "rounded-xl border [&_a]:pointer-events-none",
      )}
    >
      {showSupportBlocks ? (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto grid max-w-[1600px] divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-10">
            <Service
              icon={<PackageCheck className="size-5" />}
              title="Carefully packed"
              text="Prepared with attention, from us to you."
            />
            <Service
              icon={<ShieldCheck className="size-5" />}
              title="Secure checkout"
              text="A simple and protected shopping experience."
            />
            <Service
              icon={<Headphones className="size-5" />}
              title="Here to help"
              text="Friendly support before and after your order."
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 md:py-16 lg:px-10">
        {showSupportBlocks ? (
          <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 px-5 py-8 sm:px-8 md:flex md:items-center md:justify-between md:gap-10 lg:px-12 lg:py-10">
            <div className="relative max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Notes from the studio
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                New edits, style stories, and lovely little surprises.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Join our list to hear about fresh arrivals and special
                collections.
              </p>
            </div>
            <Link
              href={newsletterHref}
              className="relative mt-6 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:mt-0"
            >
              <Mail className="size-4" /> Join our list
            </Link>
          </section>
        ) : null}

        <div
          className={cn(
            "grid gap-10 border-b border-border pb-12 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(8rem,1fr))] lg:gap-12",
            showSupportBlocks && "mt-14",
          )}
        >
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <FooterBrand logoUrl={settings.logoUrl} storeName={storeName} />
            {config.description ? (
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {config.description}
              </p>
            ) : null}
            <ContactLinks
              email={settings.contact_email}
              phone={settings.contact_phone}
            />
            {socialLinks.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
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
            ) : null}
          </div>
          {columns.map((column) => (
            <FooterColumnLinks
              key={column.id}
              column={column}
              pathname={pathname}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5 pt-7 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>
              © {new Date().getFullYear()} {storeName}
            </span>
            {legalLinks.map((link) => (
              <SafeFooterLink
                key={link.id}
                link={link}
                pathname={pathname}
                className="transition hover:text-primary"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Heart className="size-3.5 text-primary" aria-hidden />
            <Link
              href="https://www.reverbsolution.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-primary"
            >
              Developed by Reverb Solution
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Service({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 px-3 py-5 sm:px-5 lg:px-8 lg:py-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {text}
        </span>
      </span>
    </div>
  );
}

function FooterBrand({
  logoUrl,
  storeName,
}: {
  logoUrl: string | null;
  storeName: string;
}) {
  return (
    <Link href="/" aria-label={`${storeName} home`} className="inline-flex">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={storeName}
          width={160}
          height={44}
          className="h-9 w-auto object-contain"
        />
      ) : (
        <span className="font-display text-2xl font-semibold tracking-[-0.04em]">
          {storeName}
        </span>
      )}
    </Link>
  );
}

function ContactLinks({
  email,
  phone,
}: {
  email: string | null;
  phone: string | null;
}) {
  const emailHref = getContactHref(email, "email", null);
  const phoneHref = getContactHref(phone, "phone", null);

  if (!emailHref && !phoneHref) return null;

  return (
    <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
      {emailHref ? (
        <a
          href={emailHref}
          className="flex items-center gap-2 transition hover:text-primary"
        >
          <Mail className="size-4 shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      ) : null}
      {phoneHref ? (
        <a
          href={phoneHref}
          className="flex items-center gap-2 transition hover:text-primary"
        >
          <Phone className="size-4 shrink-0" />
          <span>{phone}</span>
        </a>
      ) : null}
    </div>
  );
}

function FooterColumnLinks({
  column,
  pathname,
}: {
  column: FooterColumn;
  pathname: string;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
        {column.title}
      </h2>
      <ul className="mt-5 space-y-3.5">
        {column.links.map((link) => (
          <li key={link.id}>
            <SafeFooterLink
              link={link}
              pathname={pathname}
              className="text-sm transition hover:text-primary"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SafeFooterLink({
  link,
  pathname,
  className,
}: {
  link: FooterLink;
  pathname: string;
  className?: string;
}) {
  const external = isExternalChromeHref(link.href);
  const active = !external && isActivePath(pathname, link.href);

  return (
    <Link
      href={link.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        className,
        active ? "font-semibold text-primary" : "text-muted-foreground",
      )}
    >
      {link.label}
    </Link>
  );
}

function getContactHref(
  value: string | null,
  kind: "email" | "phone",
  fallback: string | null = "/contact-us",
): string {
  if (!value?.trim()) return fallback ?? "";
  const href = `${kind === "email" ? "mailto" : "tel"}:${value.trim()}`;
  return isSafeChromeHref(href) ? href : (fallback ?? "");
}

function getSocialLinks(socials: Record<string, string>) {
  return [
    {
      label: "Facebook",
      href: socials.facebook,
      icon: <FacebookIcon className="size-4" size={16} />,
    },
    {
      label: "Instagram",
      href: socials.instagram,
      icon: <InstagramIcon className="size-4" size={16} />,
    },
    {
      label: "X",
      href: socials.twitter,
      icon: <TwitterIcon className="size-4" size={16} />,
    },
    {
      label: "YouTube",
      href: socials.youtube,
      icon: <YoutubeIcon className="size-4" size={16} />,
    },
  ].filter(
    (
      social,
    ): social is { label: string; href: string; icon: React.JSX.Element } =>
      Boolean(
        social.href &&
        isSafeChromeHref(social.href) &&
        isExternalChromeHref(social.href),
      ),
  );
}
