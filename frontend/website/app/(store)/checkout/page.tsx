import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPageScreen from "@/components/CheckoutPage/CheckoutPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getSiteSettings } from "@/utility/getSettings";
import { getBkashSettings, isBkashReady } from "@/lib/payments/bkashSettings";
import { getSmsSettings, isSmsReady } from "@/lib/sms/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("checkout"));
}

export default async function CheckoutPage() {
  const [settings, bkash, sms] = await Promise.all([
    getSiteSettings(),
    getBkashSettings(),
    getSmsSettings(),
  ]);

  const bkashEnabled =
    isBkashReady(bkash) && (settings.currency || "BDT").toUpperCase() === "BDT";
  const otpEnabled = isSmsReady(sms) && sms.checkoutOtp;

  return (
    <Suspense fallback={null}>
      <CheckoutPageScreen
        deliveryCharges={settings.deliveryCharges}
        bkashEnabled={bkashEnabled}
        otpEnabled={otpEnabled}
      />
    </Suspense>
  );
}
