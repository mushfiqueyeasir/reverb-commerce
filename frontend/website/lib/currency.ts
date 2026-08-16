export type CurrencyCode = "USD" | "BDT" | "INR";

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "US Dollar", flag: "US" },
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka", flag: "BD" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", flag: "IN" },
];

export interface CurrencySettings {
  /** Enabled store currencies (at least one). */
  enabled: CurrencyCode[];
  /** Default / active storefront currency. */
  default: CurrencyCode;
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  enabled: ["BDT"],
  default: "BDT",
};

export function getCurrencyMeta(code: string): CurrencyOption {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0]
  );
}

/**
 * Only one currency is ever active at a time: the default. The enabled list
 * mirrors the single active currency so the rest of the store never sees a
 * multi-currency configuration.
 */
export function normalizeCurrencySettings(
  raw?: Partial<CurrencySettings> | null,
): CurrencySettings {
  const requested =
    raw?.default ?? raw?.enabled?.[0] ?? DEFAULT_CURRENCY_SETTINGS.default;
  const def = (
    SUPPORTED_CURRENCIES.some((opt) => opt.code === requested)
      ? requested
      : DEFAULT_CURRENCY_SETTINGS.default
  ) as CurrencyCode;
  return { enabled: [def], default: def };
}

export function formatMoney(value: number, symbolOrCode: string = "৳"): string {
  const meta = getCurrencyMeta(symbolOrCode);
  const symbol = meta.code === symbolOrCode ? meta.symbol : symbolOrCode;
  const n = Number.isFinite(value) ? value : 0;
  return `${symbol}${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
