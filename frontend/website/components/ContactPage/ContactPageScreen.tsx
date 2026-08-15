"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ContactFormLayoutProps } from "@/components/themes/types";
import Input from "@/components/Common/Input";
import Textarea from "@/components/Common/Textarea";
import { submitContactForm } from "@/utility/submitContactForm";

interface ContactPageScreenProps {
  layout?: React.ComponentType<ContactFormLayoutProps>;
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

export default function ContactPageScreen({ layout }: ContactPageScreenProps) {
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

  const ContactLayout = layout;

  if (ContactLayout) {
    return (
      <ContactLayout
        formData={formData}
        isSubmitting={isSubmitting}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    );
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
