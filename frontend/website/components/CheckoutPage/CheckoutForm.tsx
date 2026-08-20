"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Input from "@/components/Common/Input";
import Select from "@/components/Common/Select";
import { submitOrder } from "@/utility/submitOrder";
import { trackPurchase } from "@/utility/analytics/facebookPixelEvents";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { shippingCostForZone, type DeliveryCharges } from "@/lib/delivery";
import { BANGLADESH_CITIES, deliveryZoneForCity } from "@/lib/bangladesh";
import { deliveryZoneLabel } from "@/lib/delivery";
import { computePromoDiscount } from "@/lib/promoCodes";
import { cn } from "@/lib/utils";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const PHONE_CODES = [
  { value: "+880", label: "BD +880" },
  { value: "+91", label: "IN +91" },
  { value: "+1", label: "US +1" },
  { value: "+44", label: "GB +44" },
  { value: "+971", label: "AE +971" },
  { value: "+966", label: "SA +966" },
  { value: "+60", label: "MY +60" },
  { value: "+65", label: "SG +65" },
  { value: "+61", label: "AU +61" },
  { value: "+49", label: "DE +49" },
];

export default function CheckoutForm({
  deliveryCharges,
  bkashEnabled = false,
  otpEnabled = false,
}: {
  deliveryCharges: DeliveryCharges;
  bkashEnabled?: boolean;
  otpEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    formData,
    appliedPromo,
    updateFormData,
    setAppliedPromo,
    saveDeliveryInfo,
    loadSavedDeliveryInfo,
  } = useCheckoutStore();
  const { items, getTotal, clearCart } = useCartStore();
  const { code, format } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpStage, setOtpStage] = useState<"idle" | "sending" | "sent">("idle");
  const [otpValue, setOtpValue] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const fullPhone = `${formData.phoneCode}${formData.phone.replace(/^0+/, "")}`;

  useEffect(() => {
    loadSavedDeliveryInfo();
  }, [loadSavedDeliveryInfo]);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      toast.error("bKash payment was not completed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!bkashEnabled && formData.paymentMethod === "bkash") {
      updateFormData({ paymentMethod: "cod" });
    }
  }, [bkashEnabled, formData.paymentMethod, updateFormData]);

  useEffect(() => {
    if (otpStage === "sent" && fullPhone !== otpPhone) {
      setOtpStage("idle");
      setOtpValue("");
    }
  }, [fullPhone, otpPhone, otpStage]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendOtp = async (): Promise<boolean> => {
    setOtpStage("sending");
    try {
      const res = await fetch("/api/sms/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send the verification code.");
        setOtpStage("idle");
        return false;
      }
      setOtpStage("sent");
      setOtpPhone(fullPhone);
      setOtpValue("");
      setResendIn(60);
      toast.success(`Verification code sent to ${fullPhone}.`);
      return true;
    } catch {
      toast.error("Failed to send the verification code. Please try again.");
      setOtpStage("idle");
      return false;
    }
  };

  const handleCompleteOrder = async () => {
    if (formData.emailOrPhone && !isValidEmail(formData.emailOrPhone)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.address || !formData.city || !formData.phone) {
      toast.error("Please complete all delivery information");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (formData.paymentMethod === "bkash" && !bkashEnabled) {
      toast.error("bKash is not available. Please choose Cash on Delivery.");
      return;
    }

    if (otpEnabled && otpStage === "idle") {
      setIsSubmitting(true);
      await sendOtp();
      setIsSubmitting(false);
      return;
    }

    if (otpEnabled && otpStage === "sent" && !otpValue.trim()) {
      toast.error("Please enter the verification code we sent you.");
      return;
    }

    setIsSubmitting(true);

    try {
      const subtotal = getTotal();
      const shipping = shippingCostForZone(
        deliveryCharges,
        formData.shippingMethod,
      );
      const discount = appliedPromo
        ? computePromoDiscount(subtotal, appliedPromo.percent)
        : 0;
      const total = Math.max(0, subtotal - discount) + shipping;

      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      const orderData = {
        delivery: {
          country: formData.country,
          firstName,
          lastName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          phone: fullPhone,
          email: formData.emailOrPhone.trim(),
          shippingMethod: formData.shippingMethod,
        },
        items: items.map((item) => ({
          product: item.id,
          variantId: item.variantId,
          title: item.title,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.currentPrice,
        })),
        promoCode: appliedPromo?.code ?? (formData.discountCode.trim() || null),
        paymentMethod: formData.paymentMethod,
        otp: otpEnabled ? otpValue.trim() : undefined,
        totals: {
          subtotal,
          shipping,
          discount,
          discount_percent: appliedPromo?.percent,
          promo_code: appliedPromo?.code ?? null,
          total,
        },
      };

      const result = await submitOrder(orderData);

      if (formData.saveInfo) {
        saveDeliveryInfo();
      }

      if (result.redirectUrl) {
        toast.message("Redirecting to bKash…");
        window.location.assign(result.redirectUrl);
        return;
      }

      // Track Purchase event for Meta catalog ads
      const productIds = items.map((item) => item.id);
      const numItems = items.reduce((sum, item) => sum + item.quantity, 0);
      trackPurchase(productIds, total, code, numItems);

      toast.success("Order placed successfully!", {
        description: result.orderNumber
          ? formData.emailOrPhone.trim()
            ? `Order ${result.orderNumber} received. A confirmation email is on the way.`
            : `Order ${result.orderNumber} received.`
          : "Your order has been received and will be processed shortly.",
      });
      clearCart();
      setAppliedPromo(null);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to place order. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Contact</h2>
        <Input
          type="email"
          label="Email (optional)"
          placeholder="you@example.com"
          value={formData.emailOrPhone}
          onChange={(e) => updateFormData({ emailOrPhone: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          We&apos;ll send your order invoice here only if you provide an email.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Delivery</h2>
        <Select
          value={formData.country}
          onChange={(e) => updateFormData({ country: e.target.value })}
        >
          <option value="Bangladesh">Bangladesh</option>
        </Select>
        <Input
          type="text"
          label="Full name *"
          placeholder="Full name"
          value={formData.fullName}
          onChange={(e) => updateFormData({ fullName: e.target.value })}
        />
        <Input
          type="text"
          label="Address *"
          placeholder="House, street, area"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            City *
          </label>
          <Select
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
          >
            <option value="">Select your city</option>
            {BANGLADESH_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
          {formData.city ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Delivery area:{" "}
              <span className="text-foreground">
                {deliveryZoneLabel(deliveryZoneForCity(formData.city))}
              </span>{" "}
              ·{" "}
              {shippingCostForZone(deliveryCharges, formData.shippingMethod) ===
              0 ? (
                "Free delivery"
              ) : (
                <>
                  {format(
                    shippingCostForZone(
                      deliveryCharges,
                      formData.shippingMethod,
                    ),
                  )}{" "}
                  delivery
                </>
              )}
            </p>
          ) : null}
        </div>
        <Input
          type="text"
          label="Postal code (optional)"
          placeholder="Postal code"
          value={formData.postalCode}
          onChange={(e) => updateFormData({ postalCode: e.target.value })}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Phone number *
          </label>
          <div className="flex gap-3">
            <div className="w-[130px] shrink-0">
              <Select
                aria-label="Country code"
                value={formData.phoneCode}
                onChange={(e) => updateFormData({ phoneCode: e.target.value })}
              >
                {PHONE_CODES.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              type="tel"
              placeholder="1XXXXXXXXXX"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={formData.saveInfo}
            onChange={(e) => updateFormData({ saveInfo: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          <span>Save this information for next time</span>
        </label>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Payment</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              formData.paymentMethod === "cod"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card hover:border-primary/50",
            )}
            onClick={() => updateFormData({ paymentMethod: "cod" })}
          >
            <span className="block font-medium">Cash on Delivery</span>
            <span className="mt-1 block text-muted-foreground">
              Pay when your order arrives
            </span>
          </button>
          {bkashEnabled ? (
            <button
              type="button"
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                formData.paymentMethod === "bkash"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:border-primary/50",
              )}
              onClick={() => updateFormData({ paymentMethod: "bkash" })}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-16 place-items-center rounded-lg bg-white px-2 py-1">
                  <Image
                    src="/images/payments/bkash.png"
                    alt="bKash"
                    width={115}
                    height={67}
                    className="max-h-7 w-auto max-w-full object-contain"
                  />
                </span>
                <span>
                  <span className="block font-medium">bKash</span>
                  <span className="mt-0.5 block text-muted-foreground">
                    Pay securely with bKash wallet
                  </span>
                </span>
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {otpEnabled ? (
        <div
          className={cn(
            "space-y-3 rounded-xl border p-4",
            otpStage === "sent"
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-card",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Phone verification
              </p>
              <p className="text-xs text-muted-foreground">
                {otpStage === "sent"
                  ? `Enter the 6-digit code sent to ${fullPhone}.`
                  : "We’ll text a one-time code to verify your order."}
              </p>
            </div>
            {otpStage === "sent" ? (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600">
                Code sent
              </span>
            ) : null}
          </div>
          {otpStage === "sent" ? (
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6-digit code"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={resendIn > 0}
                className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleCompleteOrder}
        disabled={isSubmitting}
        className="w-full rounded-full bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? otpEnabled && otpStage === "sent"
            ? "Verifying…"
            : otpEnabled && otpStage === "sending"
              ? "Sending code…"
              : formData.paymentMethod === "bkash"
                ? "Starting bKash…"
                : "Placing order…"
          : otpEnabled && otpStage === "idle"
            ? "Confirm & send code"
            : otpEnabled && otpStage === "sent"
              ? "Verify & Place order"
              : formData.paymentMethod === "bkash"
                ? "Pay with bKash"
                : "Complete order"}
      </button>
    </div>
  );
}
