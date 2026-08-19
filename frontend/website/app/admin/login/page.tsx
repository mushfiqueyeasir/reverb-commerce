"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { signInAdmin } from "@/app/admin/auth-audit-actions";
import {
  useStoreLogo,
  useStoreName,
} from "@/components/providers/StoreBrandProvider";
import { Skeleton } from "@/components/ui/skeleton";

const SPRING = { type: "spring", bounce: 0, duration: 0.55 } as const;

const FEATURES = [
  { label: "Products", status: "Live", icon: Package },
  { label: "Orders", status: "Realtime", icon: ShoppingBag },
  { label: "Content", status: "Editorial", icon: FileText },
];

function Rise({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={
        reduced ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(6px)" }
      }
      animate={
        reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      transition={reduced ? { duration: 0.35, delay } : { ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

function CursorGlow() {
  const reduced = useReducedMotion();
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const sx = useSpring(x, { bounce: 0, duration: 0.5 });
  const sy = useSpring(y, { bounce: 0, duration: 0.5 });
  const background = useMotionTemplate`radial-gradient(620px circle at ${sx}px ${sy}px, rgb(var(--primary-rgb) / 0.09), transparent 65%)`;

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced, x, y]);

  if (reduced) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background }}
    />
  );
}

function Field({
  id,
  type,
  label,
  icon: Icon,
  autoComplete,
  placeholder,
  value,
  onChange,
  adornment,
}: {
  id: string;
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  adornment?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground"
      >
        {label}
      </label>
      <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 transition-all focus-within:border-primary/60 focus-within:bg-card focus-within:ring-4 focus-within:ring-primary/10">
        <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {adornment}
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  return (
    <Field
      id="password"
      type={visible ? "text" : "password"}
      label="Password"
      icon={KeyRound}
      autoComplete="current-password"
      value={value}
      onChange={onChange}
      placeholder="••••••••"
      adornment={
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          className="-mr-2 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={visible ? "hide" : "show"}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, rotate: -25, scale: 0.5 }
              }
              animate={
                reduced ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }
              }
              exit={
                reduced ? { opacity: 0 } : { opacity: 0, rotate: 25, scale: 0.5 }
              }
              transition={reduced ? { duration: 0.15 } : SPRING}
              className="grid size-4 place-items-center"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </motion.span>
          </AnimatePresence>
        </button>
      }
    />
  );
}

function LoginForm() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const safeRedirect =
      redirect.startsWith("/admin") && !redirect.startsWith("//")
        ? redirect
        : "/admin";
    const result = await signInAdmin(trimmedEmail, password);
    if (result.error) {
      setLoading(false);
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Welcome back");
    // Full navigation so middleware sees the new auth cookies reliably.
    window.location.assign(safeRedirect);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            role="alert"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduced ? { duration: 0.2 } : SPRING}
            className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Rise delay={0.3}>
        <Field
          id="email"
          type="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@store.example"
        />
      </Rise>

      <Rise delay={0.36}>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
      </Rise>

      <Rise delay={0.42}>
        <motion.button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-primary px-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_16px_48px_-16px_rgb(var(--primary-rgb)/0.6)] transition-all hover:bg-primary/90 hover:shadow-[0_24px_64px_-16px_rgb(var(--primary-rgb)/0.75)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full group-disabled:hidden"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={reduced ? { duration: 0.15 } : SPRING}
                className="inline-flex items-center gap-2.5"
              >
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={reduced ? { duration: 0.15 } : SPRING}
                className="inline-flex items-center gap-2.5"
              >
                <Lock className="size-3.5 opacity-70" />
                Sign in
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </Rise>
    </form>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading" role="status">
      <span className="sr-only">Loading sign-in form</span>
      <div aria-hidden="true" className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-full" />
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const storeName = useStoreName();
  const logoUrl = useStoreLogo();
  const reduced = useReducedMotion();
  const initial = (storeName.trim().charAt(0) || "S").toUpperCase();

  return (
    <div className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* Atmosphere — grid lines + dot grid + breathing glow + cursor glow + vignette */}
      <div
        className="absolute inset-0 z-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-0 [background-image:radial-gradient(rgb(var(--foreground-rgb)/0.05)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[34%] top-1/2 z-0 h-[min(75vh,760px)] w-[min(75vh,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--primary-rgb) / 0.16) 0%, rgb(var(--primary-rgb) / 0.05) 40%, transparent 70%)",
          }}
          animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <CursorGlow />
      <div
        className="pointer-events-none absolute inset-0 z-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 py-8 md:min-h-[100dvh] md:flex-row md:items-stretch md:gap-12 md:px-10 md:py-10 lg:gap-20">
        {/* Brand column */}
        <div className="relative flex flex-1 flex-col justify-between pb-10 md:pb-0 md:pr-4">
          {/* Watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 left-0 z-0 hidden select-none font-display text-[clamp(9rem,22vw,20rem)] font-bold leading-none tracking-[-0.06em] text-foreground/[0.035] sm:block"
          >
            {initial}
          </span>

          <div className="relative">
            <Rise delay={0.05}>
              <Link href="/" className="group inline-flex items-center gap-3">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={storeName}
                    width={400}
                    height={160}
                    priority
                    className="h-9 w-auto"
                  />
                ) : (
                  <>
                    <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground shadow-[0_0_0_1px_rgb(var(--primary-rgb)/0.25),0_10px_30px_-10px_rgb(var(--primary-rgb)/0.6)] transition-transform duration-300 group-hover:scale-105">
                      {initial}
                    </span>
                    <span className="font-display text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
                      {storeName} Admin
                    </span>
                  </>
                )}
              </Link>
            </Rise>

            <Rise delay={0.12}>
              <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-muted-foreground md:mt-16 md:px-4 md:py-1.5 md:text-[11px]">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                Staff access
              </div>
            </Rise>

            <Rise delay={0.2}>
              <h1 className="mt-5 max-w-xl font-display text-[clamp(2.25rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.045em] text-foreground md:mt-6">
                Control
                <br />
                the{" "}
                <span className="whitespace-nowrap text-primary text-glow-coral">
                  drop
                </span>
              </h1>
            </Rise>

            <Rise delay={0.3}>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground md:mt-6 md:text-base">
                Sign in to manage products, orders, and the {storeName}
                storefront — the same storefront, with the tools to manage it.
              </p>
            </Rise>

            <Rise delay={0.38}>
              <Link
                href="/"
                className="group mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-primary md:mt-8"
              >
                Back to store
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Rise>
          </div>

          <Rise delay={0.5}>
            <div className="mt-12 hidden border-t border-border/80 pt-5 md:mt-0 md:block">
              <div className="grid grid-cols-3 gap-x-6">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.label} className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-foreground/85">
                          {feature.label}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                          <span className="size-1 rounded-full bg-primary" />
                          {feature.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Rise>
        </div>

        {/* Sign-in panel */}
        <div className="flex flex-1 items-center justify-center md:max-w-md md:justify-end lg:max-w-lg">
          <motion.div
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--mx",
                `${e.clientX - rect.left}px`,
              );
              e.currentTarget.style.setProperty(
                "--my",
                `${e.clientY - rect.top}px`,
              );
            }}
            initial={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.965, filter: "blur(14px)" }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, filter: "blur(0px)" }
            }
            transition={reduced ? { duration: 0.45, delay: 0.12 } : { ...SPRING, delay: 0.12 }}
            className="group glass relative w-full overflow-hidden rounded-2xl p-7 shadow-[0_48px_140px_-48px_rgba(0,0,0,0.95)] [@media(prefers-reduced-transparency:reduce)]:bg-card [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none sm:p-9"
          >
            {/* Hairline accent */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            />
            {/* Mouse-tracking spotlight */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--primary-rgb) / 0.09), transparent 70%)",
              }}
            />

            <div className="relative mb-7">
              <Rise delay={0.2}>
                <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                  <span className="grid size-6 place-items-center rounded-md border border-primary/25 bg-primary/10">
                    <ShieldCheck className="size-3" />
                  </span>
                  Control room
                </p>
              </Rise>
              <Rise delay={0.26}>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Admin sign in
                </h2>
              </Rise>
              <Rise delay={0.32}>
                <p className="mt-2 text-sm text-muted-foreground">
                  Use your staff credentials to continue.
                </p>
              </Rise>
            </div>

            <div className="relative">
              <Suspense fallback={<FormSkeleton />}>
                <LoginForm />
              </Suspense>
            </div>

            <Rise delay={0.5}>
              <p className="relative mt-7 flex items-center gap-1.5 border-t border-border/70 pt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                <Lock className="size-3.5 text-primary" />
                Encrypted session
              </p>
            </Rise>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
