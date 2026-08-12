import Image from "next/image";
import { Scissors, Shirt, Layers, Zap, Sparkles, Award } from "lucide-react";

interface RichTextSectionProps {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  config?: Record<string, unknown>;
  imageUrl?: string | null;
}

const specs = [
  { icon: Layers, label: "240 GSM", sub: "Heavyweight" },
  { icon: Shirt, label: "100% Cotton", sub: "Long staple" },
  { icon: Scissors, label: "Drop Shoulder", sub: "Signature cut" },
  { icon: Zap, label: "Oversized Fit", sub: "Boxy, relaxed" },
  { icon: Sparkles, label: "Pre-Shrunk", sub: "Zero surprises" },
  { icon: Award, label: "Premium Stitch", sub: "Double-needle" },
];

export default function RichTextSection({
  title,
  subtitle,
  body,
  config,
  imageUrl,
}: RichTextSectionProps) {
  if (!title && !subtitle && !body) return null;

  const isFabric = config?.variant === "fabric";
  const fabricUrl = imageUrl ?? "/images/lovable/fabric-texture.jpg";

  if (isFabric) {
    return (
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="mx-auto max-w-[1600px] px-6 md:px-10">
          <div
            className={`grid gap-10 lg:gap-20 ${fabricUrl ? "lg:grid-cols-2" : ""}`}
          >
            {fabricUrl ? (
              <div className="relative">
                <div className="relative aspect-[5/6] overflow-hidden rounded-3xl border border-border">
                  <Image
                    src={fabricUrl}
                    alt="Product detail"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  <div className="glass absolute bottom-4 left-4 right-4 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 sm:bottom-6 sm:left-6 sm:right-6 sm:px-5 sm:py-4">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Fabric
                      </div>
                      <div className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">
                        240 GSM Cotton
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-xs text-primary">
                      // LAB 04
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                <span className="h-px w-8 bg-primary" />
                {subtitle || "Material Study"}
              </div>
              <h2 className="font-display text-5xl font-bold leading-[0.9] tracking-tight md:text-6xl">
                {(title || "Every thread engineered.")
                  .split(" ")
                  .slice(0, 2)
                  .join(" ")}
                <br />
                {(title || "Every thread engineered.")
                  .split(" ")
                  .slice(2)
                  .join(" ") || "engineered."}
              </h2>
              {body && (
                <p className="mt-6 max-w-md text-muted-foreground">{body}</p>
              )}
              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-card/80"
                  >
                    <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    <div className="mt-4 font-display text-lg font-semibold tracking-tight">
                      {label}
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10">
      {subtitle && (
        <span className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
          {subtitle}
        </span>
      )}
      {title && (
        <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {title}
        </h2>
      )}
      {body && (
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          {body.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </section>
  );
}
