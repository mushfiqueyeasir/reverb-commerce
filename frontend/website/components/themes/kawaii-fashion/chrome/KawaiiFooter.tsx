"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Mail, Phone } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/Common/Icons";
import {
  interpolateChromeTemplate,
  isExternalChromeHref,
  isSafeChromeHref,
  type FooterColumn,
  type FooterCopy,
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
  const storeName = settings.store_name;
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
  const socialLinks = getSocialLinks(settings.socials, config.copy);

  return (
    <footer
      className={cn(
        "relative overflow-hidden border-t border-border bg-background text-foreground",
        preview && "rounded-xl border [&_a]:pointer-events-none",
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 md:py-16 lg:px-10">
        <div className="grid gap-10 border-b border-border pb-12 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1.5fr)_repeat(3,minmax(8rem,1fr))] lg:gap-12">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <FooterBrand
              logoUrl={settings.logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={config.copy.homeLinkAriaLabelTemplate}
            />
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
              {interpolateChromeTemplate(
                config.copy.copyrightTemplate,
                { year: new Date().getFullYear(), storeName },
                ["year", "storeName"],
              )}
            </span>
            {legalLinks.map((link) => (
              <SafeFooterLink
                key={link.id}
                link={link}
                pathname={pathname}
                className="transition hover:text-primary-readable"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Heart className="size-3.5 text-primary-readable" aria-hidden />
            <Link
              href="https://www.reverbsolution.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-primary-readable"
            >
              Developed by Reverb Solution
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterBrand({
  logoUrl,
  storeName,
  homeLinkAriaLabelTemplate,
}: {
  logoUrl: string | null;
  storeName: string;
  homeLinkAriaLabelTemplate: string;
}) {
  return (
    <Link
      href="/"
      aria-label={interpolateChromeTemplate(
        homeLinkAriaLabelTemplate,
        { storeName },
        ["storeName"],
      )}
      className="inline-flex"
    >
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
          className="flex items-center gap-2 transition hover:text-primary-readable"
        >
          <Mail className="size-4 shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      ) : null}
      {phoneHref ? (
        <a
          href={phoneHref}
          className="flex items-center gap-2 transition hover:text-primary-readable"
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
              className="text-sm transition hover:text-primary-readable"
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
        active
          ? "font-semibold text-primary-readable"
          : "text-muted-foreground",
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

function getSocialLinks(socials: Record<string, string>, copy: FooterCopy) {
  return [
    {
      id: "facebook",
      label: copy.facebookAriaLabel,
      href: socials.facebook,
      icon: <FacebookIcon className="size-4" size={16} />,
    },
    {
      id: "instagram",
      label: copy.instagramAriaLabel,
      href: socials.instagram,
      icon: <InstagramIcon className="size-4" size={16} />,
    },
    {
      id: "twitter",
      label: copy.twitterAriaLabel,
      href: socials.twitter,
      icon: <TwitterIcon className="size-4" size={16} />,
    },
    {
      id: "youtube",
      label: copy.youtubeAriaLabel,
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
  );
}
