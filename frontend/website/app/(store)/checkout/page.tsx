import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPageScreen from "@/components/CheckoutPage/CheckoutPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getSiteSettings } from "@/utility/getSettings";
import { getBkashSettings, isBkashReady } from "@/lib/payments/bkashSettings";
import { isStoreSetupMode } from "@/lib/config.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("checkout"));
}

export default async function CheckoutPage() {
  if (isStoreSetupMode()) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-24 text-center md:px-10">
        <div className="w-full rounded-[2rem] border border-border bg-card p-10 md:p-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            Store setup
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Checkout is not open yet.
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-muted-foreground">
            This storefront is being configured. Product and policy content may
            still be placeholders, and orders cannot be submitted.
          </p>
        </div>
      </main>
    );
  }

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
