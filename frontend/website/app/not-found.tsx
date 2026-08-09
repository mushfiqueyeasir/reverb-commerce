import type { Metadata } from "next";
import NotFoundScreen from "@/components/Common/NotFoundScreen";
import { getSiteSettings } from "@/utility/getSettings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store_name || "Store";
  return {
    title: `Page not found | ${storeName}`,
    description: `This page doesn't exist. Head home or browse the ${storeName} collection.`,
    robots: "noindex, follow",
  };
}

export default function NotFound() {
  return <NotFoundScreen variant="standalone" />;
}
