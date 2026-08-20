"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
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

export type ZaroFooterSettings = Pick<
  SiteSettings,
  | "store_name"
  | "socials"
  | "footer"
  | "logoUrl"
  | "contact_email"
  | "contact_phone"
>;

export interface ZaroFooterProps {
  settings: ZaroFooterSettings;
  preview?: boolean;
}

export default function ZaroFooter({
  settings,
  preview = false,
}: ZaroFooterProps) {
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
        "relative overflow-hidden bg-[#1f1f1b] text-white",
        preview && "rounded-xl [&_a]:pointer-events-none",
      )}
    >
      <div className="mx-auto max-w-[1440px] px-6 py-14 sm:px-10 lg:px-[40px] lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(16rem,1.2fr)_minmax(0,1.8fr)]">
          <div>
            <FooterBrand
              logoUrl={settings.logoUrl}
              storeName={storeName}
              homeLinkAriaLabelTemplate={config.copy.homeLinkAriaLabelTemplate}
            />
            {config.description ? (
              <p className="mt-6 max-w-sm text-base font-medium leading-relaxed text-white/80">
                {config.description}
              </p>
            ) : null}
            {settings.contact_email?.trim() ? (
              <a
                href={`mailto:${settings.contact_email.trim()}`}
                className="mt-6 flex items-center gap-3 text-sm font-medium text-white/80 transition-colors hover:text-[#ffc400]"
              >
                <Mail className="size-4" />
                <span className="truncate">
                  {settings.contact_email.trim()}
                </span>
              </a>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((column) => (
              <FooterColumnLinks
                key={column.id}
                column={column}
                pathname={pathname}
              />
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/15 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[13px] text-white/80">
            {interpolateChromeTemplate(
              config.copy.copyrightTemplate,
              { year: new Date().getFullYear(), storeName },
              ["year", "storeName"],
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <SafeFooterLink
                key={link.id}
                link={link}
                pathname={pathname}
                className="text-[13px] text-white/80 transition hover:text-[#ffc400]"
              />
            ))}
          </div>
          {socialLinks.length ? (
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-10 place-items-center rounded-full border border-white/25 text-white/80 transition hover:border-[#ffc400] hover:bg-[#ffc400] hover:text-[#1f1f1b]"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-[13px] text-white/60">
          Developed by{" "}
          <Link
            href="https://www.reverbsolution.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-4 transition hover:text-[#ffc400]"
          >
            Reverb Solution
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </p>
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
          height={40}
          className="h-8 w-auto object-contain brightness-0 invert"
        />
      ) : (
        <span className="font-display text-2xl font-semibold tracking-[0.08em] text-white">
          {storeName}
        </span>
      )}
    </Link>
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
      <h2 className="text-base font-medium text-white">{column.title}</h2>
      <ul className="mt-5 space-y-3">
        {column.links.map((link) => (
          <li key={link.id}>
            <SafeFooterLink
              link={link}
              pathname={pathname}
              className="text-[13px] text-white/80 transition hover:text-[#ffc400]"
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
      className={cn(className, active && "text-[#ffc400]")}
    >
      {link.label}
    </Link>
  );
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
