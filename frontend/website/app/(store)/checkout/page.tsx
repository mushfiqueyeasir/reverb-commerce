import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPageScreen from "@/components/CheckoutPage/CheckoutPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getSiteSettings } from "@/utility/getSettings";
import { getBkashSettings, isBkashReady } from "@/lib/payments/bkashSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("checkout"));
}

export default async function CheckoutPage() {
  const [settings, bkash] = await Promise.all([
    getSiteSettings(),
    getBkashSettings(),
  ]);

  const bkashEnabled =
    isBkashReady(bkash) && (settings.currency || "BDT").toUpperCase() === "BDT";

  return (
    <Suspense fallback={null}>
      <CheckoutPageScreen
        deliveryCharges={settings.deliveryCharges}
        bkashEnabled={bkashEnabled}
      />
    </Suspense>
  );
}
