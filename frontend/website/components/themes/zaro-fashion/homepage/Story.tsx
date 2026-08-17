import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { safeZaroHref } from "@/components/themes/zaro-fashion/safeHref";

interface ZaroStoryProps {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  editorialEyebrow?: string | null;
  editorialTitle?: string | null;
  editorialBody?: string | null;
  editorialImages?: string[] | null;
  realStyleTitle?: string | null;
  realStyleSubtitle?: string | null;
}

const MODERN_DETAILS_FALLBACKS = [
  "/images/themes/zaro-fashion/modern-details-1.jpg",
  "/images/themes/zaro-fashion/modern-details-2.jpg",
  "/images/themes/zaro-fashion/modern-details-3.jpg",
];

export default function ZaroStory({
  title,
  subtitle,
  body,
  eyebrow,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  editorialEyebrow,
  editorialTitle,
  editorialBody,
  editorialImages,
  realStyleTitle,
  realStyleSubtitle,
}: ZaroStoryProps) {
  const normalizedEyebrow =
    editorialEyebrow?.trim() ?? eyebrow?.trim() ?? "Modern Details";
  const normalizedTitle =
    editorialTitle?.trim() ?? title?.trim() ?? "Modern Details";
  const normalizedBody = editorialBody?.trim() ?? subtitle?.trim();
  const normalizedBodyHtml = editorialBody?.trim() ? null : body?.trim();
  const heroImage = imageUrl || MODERN_DETAILS_FALLBACKS[0];
  const images =
    editorialImages && editorialImages.length >= 2
      ? editorialImages
      : MODERN_DETAILS_FALLBACKS;
  const tickerTitle = realStyleTitle?.trim() || "Feel authentic";
  const tickerSubtitle = realStyleSubtitle?.trim() || "Feel trending";

  return (
    <>
      <section className="bg-[#f9f5f3] py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
                <Image
                  src={heroImage}
                  alt={imageAlt || normalizedTitle}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 hidden w-40 overflow-hidden rounded-[16px] shadow-xl sm:block lg:-right-8">
                <Image
                  src={images[2]}
                  alt=""
                  width={320}
                  height={400}
                  className="aspect-[4/5] object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#7e796a]">
                {normalizedEyebrow}
              </p>
              <h2 className="mt-4 max-w-lg text-balance font-display text-4xl font-medium leading-[1.15em] text-[#1f1f1b] sm:text-5xl">
                {normalizedTitle}
              </h2>
              {normalizedBody ? (
                <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-[#7e796a]">
                  {normalizedBody}
                </p>
              ) : normalizedBodyHtml ? (
                <div
                  className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-[#7e796a]"
                  dangerouslySetInnerHTML={{ __html: normalizedBodyHtml }}
                />
              ) : null}
              {ctaLabel?.trim() ? (
                <Link
                  href={safeZaroHref(ctaHref, "/product")}
                  className="group mt-10 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1f1f1b] px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-[#ffc400] hover:text-[#1f1f1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f1f1b] focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
                >
                  {ctaLabel.trim()}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 lg:gap-6">
            {images.slice(0, 3).map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-[3/4] overflow-hidden rounded-[20px]"
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#1f1f1b] py-24 text-white sm:py-32 lg:py-36">
        <Image
          src="/images/themes/zaro-fashion/real-style-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-6 text-center sm:px-10 lg:px-[40px]">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-[#ffc400]">
            Real style
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-8">
            <h2 className="font-display text-6xl font-extrabold uppercase leading-[0.9em] tracking-[-0.01em] text-white sm:text-7xl lg:text-[90px]">
              {tickerTitle}
            </h2>
            <h2
              className="font-display text-6xl font-extrabold uppercase leading-[0.9em] tracking-[-0.01em] text-transparent sm:text-7xl lg:text-[90px]"
              style={{
                WebkitTextStroke: "1px #fff",
              }}
            >
              {tickerSubtitle}
            </h2>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-white/85">
            "Elevated essentials designed for the way you really live — relaxed,
            confident, and unmistakably you."
          </p>
        </div>
      </section>
    </>
  );
}
