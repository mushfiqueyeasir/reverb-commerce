import type { Metadata } from "next";
import ReviewPageScreen from "@/components/ReviewPage/ReviewPageScreen";
import { generateMetadata as generateSeoMetadata } from "@/utility/generateMetadata";
import { getSeoItem } from "@/utility/getSeoSettings";
import { getReviews, transformReview } from "@/utility/getReview";
import { getSiteSettings } from "@/utility/getSettings";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return generateSeoMetadata(await getSeoItem("reviews"));
}

export default async function ReviewsPage() {
  const [reviews, settings] = await Promise.all([
    getReviews(),
    getSiteSettings(),
  ]);
  return (
    <ReviewPageScreen
      reviews={reviews.map(transformReview)}
      storeName={settings.store_name || "Store"}
    />
  );
}
