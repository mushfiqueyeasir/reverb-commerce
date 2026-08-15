import { requireAdminSession, canWrite } from "@/lib/admin/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import type { HomepageRendererData } from "@/components/HomePage/HomepageRenderer";
import { selectHomepageProducts } from "@/lib/products/homepageFeatured";
import { getStorefrontThemeManifest } from "@/lib/theme/manifest";
import { readCurrentPublishedStorefrontTheme } from "@/lib/theme/store";
import { getBanners } from "@/utility/getBanners";
import { getCategories } from "@/utility/getCategory";
import { getProductsPage, transformProduct } from "@/utility/getProducts";
import { getPromotions } from "@/utility/getPromotion";
import { getReviews, transformReview } from "@/utility/getReview";
import { HomepageWorkspace } from "./HomepageWorkspace";
import { listSections } from "./actions";

export const dynamic = "force-dynamic";

export default async function HomepagePage() {
  const session = await requireAdminSession();
  const writable = canWrite(session.role);
  const [
    sections,
    publishedTheme,
    banners,
    bannersV2,
    categories,
    productPage,
    reviews,
    promotions,
  ] = await Promise.all([
    listSections(),
    readCurrentPublishedStorefrontTheme(),
    getBanners("banner"),
    getBanners("banner_v2"),
    getCategories(),
    getProductsPage(
      {
        search: "",
        categoryIds: [],
        availability: [],
        minPrice: null,
        maxPrice: null,
        sort: "featured",
      },
      1,
      72,
    ),
    getReviews(),
    getPromotions(),
  ]);
  const manifest = getStorefrontThemeManifest(
    publishedTheme.config.themeId,
    publishedTheme.config.themeVersion,
  );
  const themeSections = sections.filter((section) =>
    manifest.slots.homepage.sectionTypes.includes(section.type),
  );
  const transformedProducts = productPage.products.map(transformProduct);
  const selectedProducts = [
    ...selectHomepageProducts(transformedProducts, 10, 10, "featured"),
    ...selectHomepageProducts(transformedProducts, 10, 10, "deals"),
    ...selectHomepageProducts(transformedProducts, 10, 10, "new-arrivals"),
  ];
  const previewData: HomepageRendererData = {
    banners,
    bannersV2,
    categories,
    products: [
      ...new Map(
        selectedProducts.map((product) => [product.id, product]),
      ).values(),
    ],
    reviews: reviews.slice(0, 24).map(transformReview),
    promotions,
  };

  return (
    <div>
      <PageHeader
        title="Homepage"
        description={`Manage the homepage sections included in ${manifest.displayName}.`}
      />
      <HomepageWorkspace
        sections={themeSections}
        canWrite={writable}
        themeId={manifest.id}
        themeName={manifest.displayName}
        rendererMapping={manifest.renderers.homepageSections}
        previewData={previewData}
      />
    </div>
  );
}
