"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import StoreInput from "@/components/Common/Input";
import { signInAdmin } from "@/app/admin/auth-audit-actions";
import { useStoreName } from "@/components/providers/StoreBrandProvider";
import { Skeleton } from "@/components/ui/skeleton";

const PARTICLES = Array.from({ length: 14 });

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const safeRedirect =
      redirect.startsWith("/admin") && !redirect.startsWith("//")
        ? redirect
        : "/admin";
    const result = await signInAdmin(trimmedEmail, password);
    if (result.error) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back");
    // Full navigation so middleware sees the new auth cookies reliably.
    window.location.assign(safeRedirect);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <StoreInput
        id="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@store.example"
      />
      <StoreInput
        id="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      <button
        type="submit"
        disabled={loading}
        className="group relative mt-2 inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-foreground px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-background transition-all hover:bg-primary hover:pl-9 hover:pr-7 hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-[13px]"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Lock className="size-3.5 opacity-70" />
        )}
        {loading ? "Signing in…" : "Sign in"}
        {!loading ? (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        ) : null}
      </button>
    </form>
  );
}

function FormSkeleton() {
  return (
    <div
      className="space-y-5"
      aria-busy="true"
      aria-label="Loading"
      role="status"
    >
      <span className="sr-only">Loading sign-in form</span>
      <div aria-hidden="true" className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-12 rounded-full" />
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const storeName = useStoreName();

  return (
    <div className="relative isolate flex min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Atmosphere — matches storefront hero */}
      <div
        className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[20%] top-[40%] h-[min(70vh,640px)] w-[min(70vh,640px)] -translate-x-1/2 -translate-y-1/2 animate-spotlight rounded-full md:left-[30%] md:h-[900px] md:w-[900px]"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.22) 0%, rgb(var(--primary-rgb) / 0.06) 35%, transparent 65%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgb(var(--primary-rgb) / 0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {PARTICLES.map((_, i) => (
          <span
            key={i}
            className="absolute bottom-0 h-1 w-1 animate-particle rounded-full bg-primary/60"
            style={{
              left: `${(i * 7.1) % 100}%`,
              animationDuration: `${8 + (i % 6) * 2}s`,
              animationDelay: `${-i * 0.7}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-between px-6 py-8 md:min-h-[100dvh] md:flex-row md:items-stretch md:gap-12 md:px-10 md:py-10 lg:gap-20">
        {/* Brand column */}
        <div className="flex flex-1 flex-col justify-between pb-8 md:pb-0 md:pr-4">
          <div>
            <Link
              href="/"
              className="animate-hero-in inline-flex items-center"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                {storeName} Admin
              </span>
            </Link>

            <div
              className="mt-10 inline-flex animate-hero-in items-center gap-3 rounded-full border border-border bg-surface/60 px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-md md:mt-16 md:px-4 md:py-1.5 md:text-[11px]"
              style={{ animationDelay: "0.12s" }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Staff access
            </div>

            <h1
              className="mt-5 max-w-xl animate-hero-in font-display text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.88] tracking-[-0.045em] text-foreground md:mt-6"
              style={{ animationDelay: "0.2s" }}
            >
              Control
              <br />
              the <span className="text-primary text-glow-coral">drop</span>
            </h1>

            <p
              className="mt-5 max-w-md animate-hero-in text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-base"
              style={{ animationDelay: "0.3s" }}
            >
              Sign in to manage products, orders, and the {storeName} storefront
              — the same storefront, with the tools to manage it.
            </p>

            <Link
              href="/"
              className="group mt-6 inline-flex animate-hero-in items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-primary md:mt-8"
              style={{ animationDelay: "0.38s" }}
            >
              Back to store
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div
            className="mt-10 hidden animate-float-up border-t border-border/80 pt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground md:mt-0 md:block md:text-[11px]"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="grid grid-cols-3 gap-x-8 gap-y-2">
              <div>
                <p className="text-foreground/85">Catalog</p>
                <p className="mt-1 text-muted-foreground">Live</p>
              </div>
              <div>
                <p className="text-foreground/85">Orders</p>
                <p className="mt-1 text-muted-foreground">Realtime</p>
              </div>
              <div>
                <p className="text-foreground/85">CMS</p>
                <p className="mt-1 text-muted-foreground">Editorial</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign-in panel */}
        <div className="flex flex-1 items-center justify-center md:max-w-md md:justify-end lg:max-w-lg">
          <div
            className="glass ring-glow w-full animate-hero-in rounded-3xl p-7 sm:p-9"
            style={{ animationDelay: "0.28s" }}
          >
            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                Control room
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Admin sign in
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your staff credentials to continue.
              </p>
            </div>

            <Suspense fallback={<FormSkeleton />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
