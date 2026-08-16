import type { ReactNode } from "react";
import { Clock3, Wrench } from "lucide-react";

const STATUS_URL =
  "https://subscription-tracker-backend.reverbsolution.com/api/v1/status";

async function isSubscriptionActive() {
  const projectId = process.env.SUBSCRIPTION_TRACKER_PROJECT_ID?.trim();
  if (!projectId) return true;

  try {
    const response = await fetch(
      `${STATUS_URL}/${encodeURIComponent(projectId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(5_000) },
    );
    const { active } = (await response.json()) as { active: boolean };
    return active;
  } catch {
    return true;
  }
}

function MaintenanceScreen({ storeName }: { storeName: string }) {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(var(--foreground-rgb) / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--foreground-rgb) / 0.045) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(80vw,720px)] w-[min(80vw,720px)] -translate-x-1/2 -translate-y-1/2 animate-spotlight rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.2) 0%, rgb(var(--primary-rgb) / 0.06) 42%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-6 py-8 md:px-10 md:py-10">
        <div
          className="animate-hero-in font-display text-2xl font-bold tracking-tight"
          style={{ animationDelay: "0.05s" }}
        >
          {storeName}
        </div>

        <section className="flex flex-1 items-center py-16 md:py-20">
          <div className="w-full max-w-3xl">
            <div
              className="inline-flex animate-hero-in items-center gap-3 rounded-full border border-border bg-card/70 px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-xl md:text-[11px]"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Temporarily unavailable
            </div>

            <div
              className="mt-8 flex animate-hero-in items-center gap-4 text-primary-readable"
              style={{ animationDelay: "0.16s" }}
              aria-hidden
            >
              <span className="grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10 md:size-14">
                <Wrench className="size-5 md:size-6" strokeWidth={1.8} />
              </span>
              <span className="h-px w-20 bg-gradient-to-r from-primary to-transparent md:w-32" />
            </div>

            <h1
              className="mt-8 max-w-3xl animate-hero-in font-display text-[clamp(3.25rem,9vw,7.5rem)] font-bold leading-[0.86] tracking-[-0.06em]"
              style={{ animationDelay: "0.22s" }}
            >
              We&apos;ll be
              <br />
              <span className="text-primary-readable">back soon.</span>
            </h1>

            <p
              className="mt-7 max-w-xl animate-hero-in text-base leading-relaxed text-muted-foreground md:text-lg"
              style={{ animationDelay: "0.3s" }}
            >
              {storeName} is taking a short pause while we make things better.
              Please check back again shortly.
            </p>

            <div
              className="mt-10 inline-flex animate-hero-in items-center gap-4 rounded-2xl border border-border bg-card/65 px-5 py-4 backdrop-blur-xl md:mt-12 md:px-6"
              style={{ animationDelay: "0.38s" }}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-readable">
                <Clock3 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Service is temporarily paused
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No action is needed. Refresh this page later.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div
          className="animate-float-up border-t border-border/80 pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:text-[11px]"
          style={{ animationDelay: "0.46s" }}
        >
          {storeName} · Maintenance in progress
        </div>
      </div>
    </main>
  );
}

export default async function SubscriptionGate({
  children,
  storeName,
}: {
  children: ReactNode;
  storeName: string;
}) {
  if (await isSubscriptionActive()) return children;
  return <MaintenanceScreen storeName={storeName} />;
}
