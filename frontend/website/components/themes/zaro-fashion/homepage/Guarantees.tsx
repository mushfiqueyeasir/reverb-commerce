import { Headphones, PackageCheck, RotateCcw, Truck } from "lucide-react";
import ZaroSectionHeading from "./SectionHeading";

const GUARANTEE_ICONS = [RotateCcw, Truck, Headphones] as const;

export interface ZaroGuaranteesProps {
  accessibleLabel: string;
  items: readonly [
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
  ];
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
}

export function ZaroGuarantees({
  accessibleLabel,
  items,
  title,
  subtitle,
  eyebrow,
}: ZaroGuaranteesProps) {
  return (
    <section
      aria-label={accessibleLabel}
      className="bg-[#e8e3e1] py-14 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-[40px]">
        <ZaroSectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-3 lg:gap-6">
          {items.map((item, index) => {
            const Icon = GUARANTEE_ICONS[index];
            return (
              <div
                key={`${index}-${item.title}`}
                className="rounded-[24px] border border-[#dedad9] bg-white p-8 lg:p-10"
              >
                <span className="grid size-12 place-items-center rounded-full bg-[#f0e6dc] text-[#1f1f1b]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-display text-2xl font-medium text-[#1f1f1b]">
                  {item.title}
                </h2>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#7e796a]">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2">
          <PackageCheck className="size-4 text-[#7e796a]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#7e796a]">
            Secure checkout · 30-day easy returns · Support 24/7
          </p>
        </div>
      </div>
    </section>
  );
}
