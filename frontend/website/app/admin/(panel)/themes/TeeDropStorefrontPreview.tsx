import type { CSSProperties } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Heart,
  House,
  Menu,
  Search,
  ShoppingBag,
  Star,
} from "lucide-react";
import { relativeLuminance } from "@/lib/theme/palette";
import { cn } from "@/lib/utils";

function contrastRatio(foreground: string, background: string) {
  const light = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  const dark = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );
  return (light + 0.05) / (dark + 0.05);
}

function primaryColors(primary: string) {
  const black = "#050505";
  const white = "#ffffff";
  return {
    foreground:
      contrastRatio(primary, black) >= contrastRatio(primary, white)
        ? black
        : white,
    readable: contrastRatio(primary, black) >= 4.5 ? primary : "#f5f3ef",
  };
}

const products = [
  {
    image: "/images/themes/legacy-classic/products/white-rider-tee.webp",
    name: "Ride Forever Graphic Tee",
    price: "৳899",
  },
  {
    image: "/images/themes/legacy-classic/products/navy-rider-tee.webp",
    name: "Midnight Ringer Tee",
    price: "৳799",
  },
  {
    image: "/images/themes/legacy-classic/products/orange-rider-tee.webp",
    name: "Burnt Orange Essential",
    price: "৳699",
  },
];

export function TShirtProductMockup({
  product,
  compact = false,
}: {
  product: (typeof products)[number];
  compact?: boolean;
}) {
  return (
    <article className="border border-[#242424] bg-[#111] p-2">
      <div
        className={cn(
          "relative overflow-hidden bg-[#090909]",
          compact ? "aspect-[4/5]" : "aspect-[5/6]",
        )}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={compact ? "140px" : "(min-width: 1280px) 22vw, 30vw"}
          className="object-cover"
        />
      </div>
      <div className="flex items-start justify-between gap-2 pt-2">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate font-semibold text-white",
              compact ? "text-[9px]" : "text-xs",
            )}
          >
            {product.name}
          </p>
          <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.14em] text-[#8b8b8b]">
            Premium cotton · Oversized
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 font-semibold text-[var(--tee-accent-readable)]",
            compact ? "text-[9px]" : "text-xs",
          )}
        >
          {product.price}
        </span>
      </div>
    </article>
  );
}

export function TShirtLifestyleMockup({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-[#242424]",
        compact ? "h-56" : "min-h-80",
      )}
    >
      <Image
        src="/images/lovable/hero-biker.jpg"
        alt="Rider wearing a premium graphic T-shirt"
        fill
        sizes={compact ? "280px" : "60vw"}
        className="object-cover object-[center_28%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-transparent" />
      <div
        className={cn("absolute inset-x-0 bottom-0", compact ? "p-4" : "p-8")}
      >
        <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--tee-accent-readable)]">
          Limited rider drop
        </p>
        <p
          className={cn(
            "mt-2 max-w-md font-black uppercase leading-[0.88] text-white",
            compact ? "text-3xl" : "text-5xl",
          )}
        >
          Wear the road.
          <br />
          Own the ride.
        </p>
      </div>
    </div>
  );
}

export function TeeDropMobileNavigation({ primary }: { primary: string }) {
  const resolved = primaryColors(primary);
  const style = {
    "--tee-primary": primary,
    "--tee-primary-foreground": resolved.foreground,
    "--tee-accent-readable": resolved.readable,
  } as CSSProperties;
  const items = [
    { label: "Home", icon: House },
    { label: "Search", icon: Search },
    { label: "Shop", icon: ShoppingBag, active: true },
    { label: "Saved", icon: Heart },
    { label: "Menu", icon: Menu },
  ];

  return (
    <div
      aria-hidden="true"
      style={style}
      className="grid h-16 grid-cols-5 border-t border-white/10 bg-[#080808]/95 px-1 pb-1 pt-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex flex-col items-center justify-center gap-1 font-mono text-[6px] uppercase tracking-[0.08em] text-[#777]"
          >
            <span
              className={cn(
                "grid size-7 place-items-center",
                item.active &&
                  "bg-[var(--tee-primary)] text-[var(--tee-primary-foreground)]",
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <span
              className={item.active ? "text-[var(--tee-accent-readable)]" : ""}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TeeDropStorefrontPreview({
  primary,
  device,
}: {
  primary: string;
  device: "desktop" | "phone";
}) {
  const phone = device === "phone";
  const resolved = primaryColors(primary);
  const style = {
    "--tee-primary": primary,
    "--tee-primary-foreground": resolved.foreground,
    "--tee-accent-readable": resolved.readable,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn("min-h-full bg-[#050505] text-[#f5f3ef]", phone && "pb-16")}
    >
      {!phone ? (
        <header className="sticky top-0 z-30 border-b border-[#242424] bg-[#080808]/95 px-7 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black uppercase tracking-[-0.05em]">
                TeeDrop
              </span>
              <span className="size-2 bg-[var(--tee-primary)]" />
            </div>
            <nav className="hidden gap-7 font-mono text-[8px] uppercase tracking-[0.2em] text-[#aaa] md:flex">
              <span>New drop</span>
              <span>Graphic tees</span>
              <span>Oversized</span>
              <span>About</span>
            </nav>
            <div className="flex items-center gap-4">
              <Search className="size-4" />
              <Heart className="size-4" />
              <ShoppingBag className="size-4" />
            </div>
          </div>
        </header>
      ) : null}

      <section
        className={cn(
          "grid bg-[#090909]",
          phone ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[0.9fr_1.1fr]",
        )}
      >
        <div
          className={cn(
            "flex flex-col justify-center",
            phone ? "order-2 px-4 py-7" : "px-8 py-12",
          )}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--tee-accent-readable)]">
            Drop 04 · 240 GSM cotton
          </p>
          <h1
            className={cn(
              "mt-3 font-black uppercase leading-[0.86] tracking-[-0.055em]",
              phone ? "text-[2.55rem]" : "text-4xl lg:text-6xl",
            )}
          >
            Born to ride.
            <br />
            Built to{" "}
            <span className="text-[var(--tee-accent-readable)]">
              stand out.
            </span>
          </h1>
          <p
            className={cn(
              "mt-4 max-w-md text-[#9a9a9a]",
              phone ? "text-[10px] leading-4" : "text-xs leading-5",
            )}
          >
            Premium oversized T-shirts made for riders, creators, and anyone who
            refuses to blend in.
          </p>
          <div className="mt-5 flex gap-2">
            <span className="inline-flex items-center gap-2 bg-[var(--tee-primary)] px-4 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--tee-primary-foreground)]">
              Shop the drop <ArrowRight className="size-3" />
            </span>
            <span className="border border-[#333] px-4 py-2 font-mono text-[8px] uppercase tracking-[0.16em] text-white">
              Explore fits
            </span>
          </div>
        </div>
        <div
          className={cn(
            "relative",
            phone ? "order-1 h-64" : "min-h-[280px] md:min-h-[360px]",
          )}
        >
          <Image
            src="/images/lovable/hero-biker.jpg"
            alt="Streetwear rider wearing an oversized T-shirt"
            fill
            sizes={phone ? "320px" : "55vw"}
            className="object-cover object-[center_24%]"
            priority
          />
          <div
            className={cn(
              "absolute inset-0",
              phone
                ? "bg-gradient-to-t from-[#090909] via-transparent to-transparent"
                : "bg-gradient-to-r from-[#090909] via-transparent to-transparent",
            )}
          />
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#242424] bg-[var(--tee-primary)] py-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--tee-primary-foreground)]">
        <div className="whitespace-nowrap">
          Ride hard · Stay wild · Premium cotton · Built for the road · Ride
          hard · Stay wild · Premium cotton
        </div>
      </div>

      <section className={phone ? "px-4 py-9" : "px-7 py-12"}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.22em] text-[var(--tee-accent-readable)]">
              Featured drop
            </p>
            <h2
              className={cn(
                "mt-2 font-black uppercase tracking-[-0.04em]",
                phone ? "text-2xl" : "text-4xl",
              )}
            >
              Built different.{" "}
              <span className="text-[var(--tee-accent-readable)]">
                Worn everywhere.
              </span>
            </h2>
          </div>
          {!phone ? (
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#999]">
              View all products →
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-6 grid gap-3",
            phone ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3",
          )}
        >
          {products.map((product) => (
            <TShirtProductMockup
              key={product.name}
              product={product}
              compact={phone}
            />
          ))}
        </div>
      </section>

      <section
        className={cn(
          "border-y border-[#242424] bg-[#0b0b0b]",
          phone
            ? "px-4 py-9"
            : "grid grid-cols-1 gap-6 px-7 py-12 md:grid-cols-2",
        )}
      >
        <TShirtLifestyleMockup compact={phone} />
        <div className={cn("flex flex-col justify-center", phone && "pt-7")}>
          <p className="font-mono text-[7px] uppercase tracking-[0.22em] text-[var(--tee-accent-readable)]">
            Material story
          </p>
          <h2
            className={cn(
              "mt-2 font-black uppercase leading-[0.92]",
              phone ? "text-2xl" : "text-4xl",
            )}
          >
            Every thread engineered.
          </h2>
          <p className="mt-3 text-[10px] leading-5 text-[#999]">
            Long-staple cotton, heavyweight structure, and a relaxed silhouette
            that keeps every print sharp.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["240 GSM", "100% cotton", "Drop shoulder", "Pre-shrunk"].map(
              (item) => (
                <div
                  key={item}
                  className="border border-[#292929] bg-[#151515] p-3 font-mono text-[8px] uppercase tracking-[0.14em]"
                >
                  <span className="mr-2 text-[var(--tee-accent-readable)]">
                    ◆
                  </span>
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={phone ? "px-4 py-9" : "px-7 py-12"}>
        <p className="font-mono text-[7px] uppercase tracking-[0.22em] text-[var(--tee-accent-readable)]">
          Rider community
        </p>
        <h2
          className={cn(
            "mt-2 font-black uppercase",
            phone ? "text-2xl" : "text-4xl",
          )}
        >
          Worn by the{" "}
          <span className="text-[var(--tee-accent-readable)]">riders.</span>
        </h2>
        <div
          className={cn(
            "mt-6 grid gap-3",
            phone ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3",
          )}
        >
          {[
            "The fabric is heavyweight but still comfortable all day.",
            "The print came out sharp and the oversized fit is perfect.",
            "Fast delivery, premium packaging, and a tee I actually wear.",
          ].map((quote, index) => (
            <div
              key={quote}
              className="border border-[#262626] bg-[#121212] p-4"
            >
              <div className="flex gap-0.5 text-[var(--tee-accent-readable)]">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="size-2.5 fill-current" />
                ))}
              </div>
              <p className="mt-3 text-[9px] leading-4 text-[#b7b7b7]">
                “{quote}”
              </p>
              <p className="mt-3 font-mono text-[7px] uppercase tracking-[0.16em] text-[#777]">
                Verified rider {index + 1}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className={cn(
          "relative overflow-hidden border-y border-[#242424]",
          phone ? "h-44" : "h-56",
        )}
      >
        <Image
          src="/images/lovable/fabric-texture.jpg"
          alt="Premium heavyweight T-shirt fabric texture"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-center",
            phone ? "px-4" : "px-8",
          )}
        >
          <p className="font-mono text-[7px] uppercase tracking-[0.22em] text-[var(--tee-accent-readable)]">
            Next limited drop
          </p>
          <p
            className={cn(
              "mt-2 font-black uppercase",
              phone ? "text-2xl" : "text-4xl",
            )}
          >
            Your next favorite tee is here.
          </p>
          <span className="mt-4 w-fit bg-[var(--tee-primary)] px-4 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--tee-primary-foreground)]">
            Shop TeeDrop
          </span>
        </div>
      </section>

      <footer
        className={cn(
          "bg-[#080808]",
          phone
            ? "px-4 py-8"
            : "grid grid-cols-1 gap-8 px-7 py-10 md:grid-cols-[1.4fr_1fr_1fr]",
        )}
      >
        <div>
          <p className="text-lg font-black uppercase">
            TeeDrop<span className="text-[var(--tee-accent-readable)]">.</span>
          </p>
          <p className="mt-2 max-w-xs text-[8px] leading-4 text-[#777]">
            Graphic T-shirts, premium blanks, and limited streetwear drops made
            to move.
          </p>
        </div>
        <div className={cn(phone && "mt-6 grid grid-cols-2 gap-6")}>
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-white">
              Shop
            </p>
            <p className="mt-3 text-[8px] leading-5 text-[#777]">
              New drop
              <br />
              Graphic tees
              <br />
              Oversized fits
            </p>
          </div>
          <div className={phone ? "" : "mt-5"}>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-white">
              Support
            </p>
            <p className="mt-3 text-[8px] leading-5 text-[#777]">
              Track order
              <br />
              Shipping & returns
              <br />
              Contact
            </p>
          </div>
        </div>
        {!phone ? (
          <div>
            <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-white">
              Join the next drop
            </p>
            <div className="mt-3 flex border border-[#292929] bg-[#111] p-2 text-[8px] text-[#777]">
              Email address{" "}
              <ArrowRight className="ml-auto size-3 text-[var(--tee-accent-readable)]" />
            </div>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
