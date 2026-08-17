import type {
  HomepageRendererData,
  HomepageRendererSection,
} from "@/components/HomePage/HomepageRenderer";
import type { Category } from "@/type/categoryType";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";

const imagePath = (file: string) => `/images/themes/zaro-fashion/${file}`;

const banners: Banner[] = [
  {
    id: "zaro-preview-banner-1",
    title: "Elevate Your Style",
    subtitle: "New season · New silhouettes",
    imageUrl: imagePath("hero-slide-1.png"),
    mobileImageUrl: imagePath("hero-slide-1.png"),
    ctaLabel: "Shop New Arrivals",
    ctaUrl: "/product",
  },
  {
    id: "zaro-preview-banner-2",
    title: "Real Women Style",
    subtitle: "Worn by real women",
    imageUrl: imagePath("hero-slide-2.png"),
    mobileImageUrl: imagePath("hero-slide-2.png"),
    ctaLabel: "Shop Women",
    ctaUrl: "/product?category=women",
  },
  {
    id: "zaro-preview-banner-3",
    title: "Timeless Modern Style",
    subtitle: "Crafted for everyday",
    imageUrl: imagePath("hero-slide-3.png"),
    mobileImageUrl: imagePath("hero-slide-3.png"),
    ctaLabel: "Explore Collections",
    ctaUrl: "/product",
  },
];

const categoryDetails = [
  {
    name: "Women’s Collection",
    description: "Curated everyday silhouettes with a modern, relaxed feel.",
    image: "collection-women.jpg",
  },
  {
    name: "Men’s Collection",
    description: "Clean, minimal pieces designed for effortless dressing.",
    image: "collection-men.jpg",
  },
  {
    name: "New Arrivals",
    description: "The freshest drops to land at Zaro this season.",
    image: "collection-new-arrivals.jpg",
  },
] as const;

const categories: Category[] = categoryDetails.map((category, index) => ({
  _id: `zaro-preview-category-${index}`,
  categoryName: category.name,
  categoryDescription: category.description,
  imageUrl: imagePath(category.image),
  parentId: null,
  sort: (index + 1) * 10,
  depth: 0,
  isDefault: false,
  categoryUrl: {
    current: index === 0 ? "women" : index === 1 ? "men" : "new-arrivals",
  },
}));

const productDetails = [
  {
    title: "Gun Print Tee",
    image: "product-gun-print",
    originalPrice: 420,
    currentPrice: 350,
    categoryIndex: 1,
  },
  {
    title: "Cotton Shirt Set",
    image: "product-cotton-set",
    originalPrice: 460,
    currentPrice: 380,
    categoryIndex: 0,
  },
  {
    title: "Beige Wool Coat",
    image: "product-beige-coat",
    originalPrice: 620,
    currentPrice: 490,
    categoryIndex: 0,
  },
  {
    title: "Oversized T-Shirt",
    image: "product-tshirt",
    originalPrice: 310,
    currentPrice: 280,
    categoryIndex: 1,
  },
  {
    title: "Baggy Wide Pants",
    image: "product-baggy",
    originalPrice: 390,
    currentPrice: 320,
    categoryIndex: 0,
  },
  {
    title: "Linen Button Down",
    image: "product-linen",
    originalPrice: 440,
    currentPrice: 360,
    categoryIndex: 1,
  },
] as const;

const products: TransformedProduct[] = productDetails.map((product, index) => {
  const category = categories[product.categoryIndex];
  const images = [1, 2, 3, 4].map((view) =>
    imagePath(`${product.image}-${view}.png`),
  );

  return {
    id: `zaro-preview-product-${index}`,
    title: product.title,
    image: images[0],
    hoverImage: images[1],
    images,
    originalPrice: product.originalPrice,
    currentPrice: product.currentPrice,
    discount: Math.round(
      ((product.originalPrice - product.currentPrice) / product.originalPrice) *
        100,
    ),
    href: "/product",
    slug: `zaro-preview-${index}`,
    sizingMode: "required",
    stock: [
      {
        id: `zaro-preview-stock-${index}`,
        size: "M",
        color: null,
        quantity: 14 + index,
      },
    ],
    sizeChart: [],
    categories: [
      {
        _id: category._id,
        categoryName: category.categoryName,
        categoryDescription: category.categoryDescription,
        categoryUrl: category.categoryUrl,
      },
    ],
    createdAt: new Date(Date.UTC(2026, 4, index + 1)).toISOString(),
  };
});

const reviews: TransformedReview[] = [
  {
    id: "zaro-preview-review-1",
    image: imagePath("blog-1.jpg"),
    customerName: "The Quiet Luxury Edit",
    body: "A closer look at the tailored layers defining this season’s relaxed silhouettes.",
    rating: 5,
  },
  {
    id: "zaro-preview-review-2",
    image: imagePath("blog-2.jpg"),
    customerName: "How to Style Beige",
    body: "Warm neutrals, easy proportions, and the pieces our stylists reach for most.",
    rating: 5,
  },
  {
    id: "zaro-preview-review-3",
    image: imagePath("blog-3.jpg"),
    customerName: "The Modern Essentials",
    body: "Five timeless staples that make getting dressed feel effortless again.",
    rating: 5,
  },
];

const promotion: Promotion = {
  _id: "zaro-preview-promotion",
  title: "Sale now on",
  description:
    "Enjoy an extra 40% off selected styles from the newest Zaro collection.",
  imageUrl: imagePath("sale-now-bg.jpg"),
  discountPercent: 40,
  ctaUrl: "/product",
  ctaLabel: "Shop Women",
};

const bannerConfig = {
  description:
    "Modern silhouettes, natural tones, and effortless pieces designed to feel authentic and trending.",
  seen_in_label: "As seen in",
};

const promoConfig = {
  promotion_id: promotion._id,
  image_path: imagePath("sale-now-bg.jpg"),
  image_alt: "Sale now on at Zaro",
  cta_url: "/product",
  cta_label: "Shop Women",
  countdown_label: "Hurry — offer ends soon",
  shop_sweater_label: "Shop the sweater",
  shop_women_label: "Shop Women",
  sale_eyebrow: "Elevated Style",
  save_big_title: "Save Big",
  save_big_body:
    "Take an extra 40% off selected styles from the newest Zaro collection.",
  save_big_cta_label: "Shop New Arrivals",
};

const storyConfig = {
  eyebrow: "Modern Details",
  editorial_eyebrow: "Modern Details",
  editorial_title: "Details that elevate the everyday",
  editorial_body:
    "From relaxed tailoring to softly rounded necklines, every Zaro piece is designed with modern proportions in mind.",
  image_path: imagePath("modern-details-1.jpg"),
  image_alt: "Modern details editorial",
  images: [
    imagePath("modern-details-1.jpg"),
    imagePath("modern-details-2.jpg"),
    imagePath("modern-details-3.jpg"),
  ],
  real_style_title: "Feel authentic",
  real_style_subtitle: "Feel trending",
  cta_label: "Explore the collection",
  cta_url: "/product",
};

export const ZARO_FASHION_PREVIEW_SECTIONS: HomepageRendererSection[] = [
  {
    id: "zaro-preview-banner-section",
    type: "banner",
    title: null,
    subtitle: null,
    body: null,
    config: { ...bannerConfig },
  },
  {
    id: "zaro-preview-categories-section",
    type: "categories",
    title: "Featured Collections",
    subtitle:
      "Shop the collections women are wearing, men can rely on, and new arrivals everyone is talking about.",
    body: null,
    config: {
      eyebrow: "Collections",
      cta_label: "Browse every style",
      category_ids: categories.map((category) => category._id),
      limit: 3,
    },
  },
  {
    id: "zaro-preview-trending-section",
    type: "deals",
    title: "Trending Now",
    subtitle: "The pieces everyone is adding to their wardrobe this month.",
    body: null,
    config: {
      eyebrow: "Shop the trend",
      limit: 6,
      cta_label: "View all",
    },
  },
  {
    id: "zaro-preview-best-sellers-section",
    type: "featured",
    title: "Best Sellers",
    subtitle:
      "Our most-loved fits, from relaxed essentials to statement layers.",
    body: null,
    config: {
      eyebrow: "Customer favorites",
      limit: 6,
      cta_label: "Shop all best sellers",
    },
  },
  {
    id: "zaro-preview-story-section",
    type: "richtext",
    title: "Modern Details",
    subtitle:
      "Relaxed tailoring, soft tones, and modern proportions designed for real life.",
    body: "<p>Every Zaro piece is cut with a relaxed, modern fit that moves with you — finished with details that make dressing feel effortless.</p>",
    config: { ...storyConfig },
  },
  {
    id: "zaro-preview-insider-section",
    type: "reviews",
    title: "Fashion Insider",
    subtitle: "Trends, styling notes, and the stories behind the collection.",
    body: null,
    config: {
      eyebrow: "From the journal",
      limit: 3,
      date_label: "Fashion Insider",
      cta_label: "Read all articles",
    },
  },
  {
    id: "zaro-preview-promo-section",
    type: "promo",
    title: "Sale now on",
    subtitle:
      "Enjoy an extra 40% off selected styles from the newest Zaro collection.",
    body: null,
    config: { ...promoConfig },
  },
  {
    id: "zaro-preview-guarantees-section",
    type: "guarantees",
    title: "Shopping made easy",
    subtitle:
      "Easy returns, fast shipping, and support that is always there when you need it.",
    body: null,
    config: {
      accessible_label: "Shopping guarantees",
      eyebrow: "Why shop with Zaro",
      items: [
        {
          title: "Easy Returns",
          body: "30-day returns with no questions asked — every order, every time.",
        },
        {
          title: "Fast Shipping",
          body: "Quick, tracked delivery so your order reaches you right on time.",
        },
        {
          title: "24/7 Support",
          body: "Our team is here around the clock to help with anything you need.",
        },
      ],
    },
  },
];

export const ZARO_FASHION_PREVIEW_DATA: HomepageRendererData = {
  banners,
  bannersV2: banners,
  categories,
  products,
  reviews,
  promotions: [promotion],
};
