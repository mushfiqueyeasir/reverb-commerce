"use client";

import { useState } from "react";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import Input from "@/components/Common/Input";
import Textarea from "@/components/Common/Textarea";
import { submitContactForm } from "@/utility/submitContactForm";
import { cn } from "@/lib/utils";

interface ContactPageScreenProps {
  variant?: "default" | "kawaii-fashion";
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function ContactPageScreen({
  variant = "default",
}: ContactPageScreenProps) {
  const isKawaii = variant === "kawaii-fashion";
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        message: formData.message.trim(),
      });

      toast.success("Thank you! Your message has been sent successfully.");
      setFormData(EMPTY_FORM);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isKawaii) {
    return <KawaiiContactForm formData={formData} isSubmitting={isSubmitting} handleChange={handleChange} handleSubmit={handleSubmit} />;
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-24 md:px-10 md:pt-36">
      <div className="mb-10 lg:mb-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
          We&apos;re here to help
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Questions about your order, sizing, or anything else? Drop us a
          message and we&apos;ll get back to you as soon as we can.
        </p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Name *"
            />

            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email *"
            />
          </div>

          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />

          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Write your message here!! *"
          />

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send message
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function KawaiiContactForm({
  formData,
  isSubmitting,
  handleChange,
  handleSubmit,
}: {
  formData: FormState;
  isSubmitting: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-background py-16 text-foreground sm:py-24 lg:py-32">
      <div
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-primary/10 blur-3xl"
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
            <span className="block font-normal italic text-primary">with us</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Questions about your order, sizing, or anything else? Drop us a
            message and we&apos;ll get back to you as soon as we can.
          </p>

          <dl className="mt-10 space-y-0 border-y border-border">
            <ContactRow icon={<Mail className="size-4" aria-hidden="true" />} label="Email" value="hello@reverb.shop" />
            <ContactRow icon={<Phone className="size-4" aria-hidden="true" />} label="Phone" value="+880 1700-000000" />
            <ContactRow icon={<MapPin className="size-4" aria-hidden="true" />} label="Studio" value="Dhaka, Bangladesh" />
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