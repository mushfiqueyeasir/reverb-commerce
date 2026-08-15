"use client";

import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import type { ContactFormLayoutProps } from "@/components/themes/types";
import { cn } from "@/lib/utils";

export function KawaiiContactForm({
  formData,
  isSubmitting,
  handleChange,
  handleSubmit,
}: ContactFormLayoutProps) {
  return (
    <section className="relative overflow-hidden bg-background pb-16 pt-8 text-foreground sm:pb-24 sm:pt-12 md:pt-20 lg:pb-32">
      <div
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-[9999px] bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] lg:gap-16 lg:px-10 xl:gap-24">
        <div className="max-w-2xl">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <span className="h-px w-7 bg-primary" aria-hidden="true" />
            We&apos;re here to help
          </p>
          <h1 className="text-balance font-display text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
            Get in touch
            <span className="block font-normal italic text-primary">
              with us
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Questions about your order, sizing, or anything else? Drop us a
            message and we&apos;ll get back to you as soon as we can.
          </p>

          <dl className="mt-10 space-y-0 border-y border-border">
            <ContactRow
              icon={<Mail className="size-4" aria-hidden="true" />}
              label="Email"
              value="hello@reverb.shop"
            />
            <ContactRow
              icon={<Phone className="size-4" aria-hidden="true" />}
              label="Phone"
              value="+880 1700-000000"
            />
            <ContactRow
              icon={<MapPin className="size-4" aria-hidden="true" />}
              label="Studio"
              value="Dhaka, Bangladesh"
            />
          </dl>
        </div>

        <div className="lg:justify-self-end lg:self-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl border border-border bg-card p-6 sm:p-8 lg:p-10"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <KawaiiInput
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name *"
                />
              </Field>
              <Field label="Email">
                <KawaiiInput
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com *"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Phone">
                <KawaiiInput
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Message">
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Write your message here *"
                  className="w-full resize-none border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "group mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 bg-primary px-6 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:w-auto",
              )}
            >
              {isSubmitting ? "Sending…" : "Send message"}
              {!isSubmitting ? (
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border py-4 last:border-b-0 sm:gap-5 sm:py-5">
      <span className="grid size-11 place-items-center rounded-2xl bg-surface text-primary">
        {icon}
      </span>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </dt>
      <dd className="font-display text-base font-semibold text-foreground sm:text-lg">
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function KawaiiInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}
