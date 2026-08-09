export const COURIER_PROVIDERS = ["pathao", "steadfast", "redx"] as const;

export type CourierProvider = (typeof COURIER_PROVIDERS)[number];

export const COURIER_META: Record<
  CourierProvider,
  { label: string; logo: string }
> = {
  pathao: { label: "Pathao", logo: "/images/couriers/pathao.svg" },
  steadfast: {
    label: "Steadfast",
    logo: "/images/couriers/steadfast.svg",
  },
  redx: { label: "REDX", logo: "/images/couriers/redx.svg" },
};

export function isCourierProvider(value: unknown): value is CourierProvider {
  return (
    typeof value === "string" &&
    COURIER_PROVIDERS.includes(value as CourierProvider)
  );
}
