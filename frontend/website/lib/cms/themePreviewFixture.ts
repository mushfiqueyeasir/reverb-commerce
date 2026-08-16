import type {
  HomepageRendererData,
  HomepageRendererSection,
} from "@/components/HomePage/HomepageRenderer";
import type { Category } from "@/type/categoryType";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";

const productImages = [
  "/images/themes/legacy-classic/products/white-rider-tee.webp",
  "/images/themes/legacy-classic/products/navy-rider-tee.webp",
  "/images/themes/legacy-classic/products/orange-rider-tee.webp",
  "/images/themes/legacy-classic/products/tee-model-portrait.webp",
  "/images/themes/legacy-classic/products/black-oversized-streetwear.webp",
];

const banners: Banner[] = [
  {
    id: "tee-preview-banner",
    title: "Born to ride. *Built to stand out.*",
    subtitle: "Drop 04 · Premium rider tees",
    imageUrl: "/images/lovable/hero-biker.jpg",
    mobileImageUrl:
      "/images/themes/legacy-classic/products/tee-model-portrait.webp",
    ctaLabel: "Shop the drop",
    ctaUrl: "/product",
  },
];

const categories: Category[] = [
  ["Graphic tees", productImages[3]],
  ["Ringer tees", productImages[1]],
  ["Oversized fits", productImages[4]],
  [
    "Rider essentials",
    "/images/themes/legacy-classic/products/vintage-motorcycle-rider.webp",
  ],
].map(([categoryName, imageUrl], index) => ({
  _id: `tee-preview-category-${index}`,
  categoryName,
  categoryDescription: "Premium T-shirt collection",
  imageUrl,
  parentId: null,
  sort: (index + 1) * 10,
  depth: 0,
  isDefault: false,
  categoryUrl: { current: `tee-preview-${index}` },
}));

const productNames = [
  "Ride Forever Graphic Tee",
  "Midnight Ringer Tee",
  "Burnt Orange Essential",
  "Road Culture Oversized Tee",
  "Limited Rider Signature Tee",
];

const products: TransformedProduct[] = productNames.map((title, index) => {
  const originalPrice = 899 + (index % 3) * 100;
  const currentPrice = originalPrice - 200;

  return {
    id: `tee-preview-product-${index}`,
    title,
    image: productImages[index % productImages.length],
    images: [productImages[index % productImages.length]],
    originalPrice,
    currentPrice,
    discount: Math.round(
      ((originalPrice - currentPrice) / originalPrice) * 100,
    ),
    href: "/product",
    slug: `tee-preview-${index}`,
    sizingMode: "none",
    stock: [
      {
        id: `tee-preview-stock-${index}`,
        size: null,
        color: null,
        quantity: 20,
      },
    ],
    sizeChart: [],
    categories: [],
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  };
});

const reviews: TransformedReview[] = [
  {
    id: "tee-preview-review-1",
    image: "/images/themes/legacy-classic/products/tee-model-portrait.webp",
    customerName: "Arian Rahman",
    body: "The heavyweight fabric and oversized fit feel premium. The print is sharp and still looks new after washing.",
    rating: 5,
  },
  {
    id: "tee-preview-review-2",
    image: "/images/themes/legacy-classic/products/streetwear-night.webp",
    customerName: "Nabil Hasan",
    body: "Exactly the streetwear fit I wanted. Fast delivery, strong packaging, and great T-shirt quality.",
    rating: 5,
  },
  {
    id: "tee-preview-review-3",
    image:
      "/images/themes/legacy-classic/products/black-oversized-streetwear.webp",
    customerName: "Rafi Ahmed",
    body: "The colors and print match the photos. Comfortable enough for everyday rides and weekend drops.",
    rating: 5,
  },
];

const promotion: Promotion = {
  _id: "tee-preview-promotion",
  title: "The new rider drop is live.",
  description: "Limited graphic T-shirts in premium heavyweight cotton.",
  imageUrl: "/images/themes/legacy-classic/products/gothic-streetwear.webp",
  discountPercent: 20,
  ctaUrl: "/product",
  ctaLabel: "Shop TeeDrop",
};

export const TEE_DROP_PREVIEW_SECTIONS: HomepageRendererSection[] = [
  {
    id: "tee-preview-banner-section",
    type: "banner",
    title: null,
    subtitle: null,
    body: null,
    config: {
      description:
        "Premium oversized T-shirts designed for riders, creators, and anyone who refuses to blend in.",
      show_marquee: true,
      stats: [
        { label: "Weight", value: "240 GSM" },
        { label: "Cotton", value: "100%" },
        { label: "Fit", value: "Oversized" },
        { label: "Drop", value: "Limited" },
      ],
      marquee_items: [
        "RIDE HARD",
        "PREMIUM COTTON",
        "GRAPHIC DROPS",
        "OVERSIZED FIT",
      ],
    },
  },
  {
    id: "tee-preview-featured-section",
    type: "featured",
    title: "Built different. Worn everywhere.",
    subtitle: "The latest TeeDrop release",
    body: null,
    config: {
      limit: 5,
      eyebrow: "Featured drop",
      cta_label: "View all tees",
    },
  },
  {
    id: "tee-preview-categories-section",
    type: "categories",
    title: "Shop the collection",
    subtitle: "Find your next fit",
    body: null,
    config: {
      eyebrow: "T-shirt collections",
      cta_label: "Browse all",
      category_ids: categories.map((category) => category._id),
    },
  },
  {
    id: "tee-preview-richtext-section",
    type: "richtext",
    title: "Every thread engineered.",
    subtitle: "Heavyweight cotton built for daily wear",
    body: "<p>Long-staple cotton, dependable structure, and a relaxed silhouette keep every graphic sharp while making each tee comfortable enough for the road.</p>",
    config: {
      eyebrow: "Material story",
      variant: "fabric",
      image_path: "/images/lovable/fabric-texture.jpg",
      cta_label: "Explore the quality",
      cta_url: "/about-us",
    },
  },
  {
    id: "tee-preview-reviews-section",
    type: "reviews",
    title: "Worn by the riders.",
    subtitle: "Real reviews from the TeeDrop community",
    body: null,
    config: {
      eyebrow: "Rider community",
      limit: 3,
      cta_label: "Read every review",
    },
  },
  {
    id: "tee-preview-promo-section",
    type: "promo",
    title: "New drop is live.",
    subtitle: "Limited quantities available",
    body: null,
    config: {
      promotion_id: promotion._id,
      cta_label: "Shop the drop",
      cta_url: "/product",
      image_path:
        "/images/themes/legacy-classic/products/vintage-motorcycle-rider.webp",
      image_alt: "New drop rider tee",
    },
  },
];

export const TEE_DROP_PREVIEW_DATA: HomepageRendererData = {
  banners,
  bannersV2: banners,
  categories,
  products,
  reviews,
  promotions: [promotion],
};
