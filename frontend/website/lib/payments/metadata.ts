export const PAYMENT_PROVIDERS = ["bkash"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_META: Record<
  PaymentProvider,
  {
    label: string;
    logo: string;
    description: string;
    requiredCurrency: string;
  }
> = {
  bkash: {
    label: "bKash",
    logo: "/images/payments/bkash.png",
    description: "Tokenized Checkout (mode 0011)",
    requiredCurrency: "BDT",
  },
};
