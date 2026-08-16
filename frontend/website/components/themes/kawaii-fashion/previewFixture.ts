import type {
  HomepageRendererData,
  HomepageRendererSection,
} from "@/components/HomePage/HomepageRenderer";
import type { Category } from "@/type/categoryType";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";

const imagePath = (file: string) =>
  `/images/themes/kawaii-fashion/${file}.webp`;

const bannerLabels = {
  edit_label: "Kawaii fashion edit",
  footer_note: "Thoughtfully selected · Easy everyday styling",
  image_badge: "The new mood",
  carousel_role_description: "carousel",
  carousel_announcement_template: "Slide {current} of {total}: {title}",
  pause_label: "Pause slide rotation",
  resume_label: "Resume slide rotation",
  previous_label: "Previous collection",
  next_label: "Next collection",
};

const productLabels = {
  sold_out_badge: "Sold out",
  special_price_badge: "Special price",
  default_badge: "New favorite",
  product_list_label: "Featured products",
  uncategorized_label_template: "Look {number}",
};

const reviewLabels = {
  customer_fallback: "Verified customer",
  body_fallback: "A lovely piece that feels just right.",
  item_label_template: "Note {number}",
  verified_label: "Verified review",
  rating_aria_template: "{rating} out of {maximum} stars",
};

const promoLabels = {
  kicker: "A special little something",
  limited_label: "Limited edit",
  discount_suffix: "off",
  image_eyebrow: "This week’s pick",
  image_title: "Wear it your way",
  cta_fallback_label: "Shop the edit",
};

const banners: Banner[] = [
  {
    id: "kawaii-preview-banner",
    title: "Wear your joy.",
    subtitle: "The pink edit · New season",
    imageUrl: imagePath("hero-millennial-pink"),
    mobileImageUrl: imagePath("meadow-pink"),
    ctaLabel: "Shop new arrivals",
    ctaUrl: "/product",
  },
];

const categoryDetails = [
  {
    name: "Pink Daydreams",
    description: "Ruffles, soft color, and playful dresses.",
    image: "meadow-pink",
  },
  {
    name: "Coastal Knits",
    description: "Light layers for breezy everyday plans.",
    image: "yacht-club-chic",
  },
  {
    name: "Lotus Occasion",
    description: "Graceful pieces with delicate details.",
    image: "lotus-style",
  },
  {
    name: "Everyday Denim",
    description: "Easy blues made for mixing and matching.",
    image: "denim-edit",
  },
  {
    name: "Sweet Accessories",
    description: "Playful finishing touches for every look.",
    image: "braided-promo",
  },
] as const;

const categories: Category[] = categoryDetails.map((category, index) => ({
  _id: `kawaii-preview-category-${index}`,
  categoryName: category.name,
  categoryDescription: category.description,
  imageUrl: imagePath(category.image),
  parentId: null,
  sort: (index + 1) * 10,
  depth: 0,
  isDefault: false,
  categoryUrl: { current: `kawaii-${index + 1}` },
}));

const productDetails = [
  {
    title: "Blush Meadow Midi Dress",
    image: "meadow-pink",
    originalPrice: 2990,
    currentPrice: 2490,
    categoryIndex: 0,
  },
  {
    title: "Harbour Stripe Knit",
    image: "yacht-club-chic",
    originalPrice: 2450,
    currentPrice: 2190,
    categoryIndex: 1,
  },
  {
    title: "Lotus Pearl Occasion Set",
    image: "lotus-style",
    originalPrice: 3590,
    currentPrice: 3190,
    categoryIndex: 2,
  },
  {
    title: "Cloud-Wash Straight Jeans",
    image: "denim-edit",
    originalPrice: 2290,
    currentPrice: 1990,
    categoryIndex: 3,
  },
  {
    title: "Rose Ruffle Day Dress",
    image: "meadow-pink",
    originalPrice: 2790,
    currentPrice: 2390,
    categoryIndex: 0,
  },
  {
    title: "Weekend Sailor Cardigan",
    image: "yacht-club-chic",
    originalPrice: 2550,
    currentPrice: 2250,
    categoryIndex: 1,
  },
  {
    title: "Petal Collar Kurti",
    image: "lotus-style",
    originalPrice: 3250,
    currentPrice: 2890,
    categoryIndex: 2,
  },
  {
    title: "Skyline Denim Edit",
    image: "denim-edit",
    originalPrice: 2190,
    currentPrice: 1890,
    categoryIndex: 3,
  },
  {
    title: "Blossom Braided Headband",
    image: "braided-promo",
    originalPrice: 1490,
    currentPrice: 1190,
    categoryIndex: 4,
  },
  {
    title: "Orchard Petal Hair Clip",
    image: "orchard-story",
    originalPrice: 1290,
    currentPrice: 990,
    categoryIndex: 4,
  },
] as const;

const products: TransformedProduct[] = productDetails.map((product, index) => {
  const category = categories[product.categoryIndex];
  const image = imagePath(product.image);

  return {
    id: `kawaii-preview-product-${index}`,
    title: product.title,
    image,
    images: [image],
    originalPrice: product.originalPrice,
    currentPrice: product.currentPrice,
    discount: Math.round(
      ((product.originalPrice - product.currentPrice) / product.originalPrice) *
        100,
    ),
    href: "/product",
    slug: `kawaii-preview-${index}`,
    sizingMode: "required",
    stock: [
      {
        id: `kawaii-preview-stock-${index}`,
        size: "Free Size",
        color: null,
        quantity: 12 + index,
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
    createdAt: new Date(Date.UTC(2026, 1, index + 1)).toISOString(),
  };
});

const reviews: TransformedReview[] = [
  {
    id: "kawaii-preview-review-1",
    image: imagePath("community-smile"),
    customerName: "Nusrat Jahan",
    body: "The colors are even prettier in person, and the dress feels light enough for a full day out.",
    rating: 5,
  },
  {
    id: "kawaii-preview-review-2",
    image: imagePath("meadow-pink"),
    customerName: "Anika Rahman",
    body: "Lovely finishing and a comfortable fit. The packaging made the whole order feel extra special.",
    rating: 5,
  },
  {
    id: "kawaii-preview-review-3",
    image: imagePath("yacht-club-chic"),
    customerName: "Farzana Alam",
    body: "My knit arrived exactly as pictured. It layers beautifully and the fabric is soft, not heavy.",
    rating: 5,
  },
  {
    id: "kawaii-preview-review-4",
    image: imagePath("lotus-style"),
    customerName: "Sadia Karim",
    body: "The details are delicate without being fussy. I have already worn it twice this week.",
    rating: 5,
  },
  {
    id: "kawaii-preview-review-5",
    image: imagePath("denim-edit"),
    customerName: "Maliha Noor",
    body: "Everything arrived beautifully packed, and the colors feel just as cheerful as the photos.",
    rating: 5,
  },
];

const promotion: Promotion = {
  _id: "kawaii-preview-promotion",
  title: "A little extra sparkle.",
  description:
    "Save on playful accessories and finishing touches from the newest Kawaii edit.",
  imageUrl: imagePath("braided-promo"),
  discountPercent: 15,
  ctaUrl: "/product",
  ctaLabel: "Shop the special edit",
};

export const KAWAII_FASHION_PREVIEW_SECTIONS: HomepageRendererSection[] = [
  {
    id: "kawaii-preview-banner-section",
    type: "banner",
    title: null,
    subtitle: null,
    body: null,
    config: {
      description:
        "Light layers, joyful color, and charming details selected for bright everyday dressing.",
      ...bannerLabels,
    },
  },
  {
    id: "kawaii-preview-categories-section",
    type: "categories",
    title: "Dress for your favorite mood",
    subtitle: "Five light-hearted edits for days that deserve a little color.",
    body: null,
    config: {
      eyebrow: "Shop the collections",
      cta_label: "Browse every style",
      category_ids: categories.map((category) => category._id),
      limit: 5,
    },
  },
  {
    id: "kawaii-preview-deals-section",
    type: "deals",
    title: "Today’s Best Deals",
    subtitle: "Lovely prices on the pieces currently at the top of our list.",
    body: null,
    config: {
      limit: 10,
      eyebrow: "Sweet offers",
      cta_label: "Shop all deals",
      ...productLabels,
    },
  },
  {
    id: "kawaii-preview-new-arrivals-section",
    type: "new_arrivals",
    title: "New Arrival Products",
    subtitle: "The newest colors, layers, and silhouettes to reach Kawaii.",
    body: null,
    config: {
      limit: 10,
      eyebrow: "Just landed",
      cta_label: "View new arrivals",
      ...productLabels,
    },
  },
  {
    id: "kawaii-preview-featured-section",
    type: "featured",
    title: "Featured Products",
    subtitle: "Fresh silhouettes in pink, pearl, coastal blue, and easy denim.",
    body: null,
    config: {
      limit: 10,
      eyebrow: "Kawaii favorites",
      cta_label: "View featured products",
      ...productLabels,
    },
  },
  {
    id: "kawaii-preview-story-section",
    type: "richtext",
    title: "Made for your everyday magic",
    subtitle: "Playful pieces should still feel effortless to wear.",
    body: "<p>Kawaii brings together soft color, easy proportions, and thoughtful details for wardrobes that feel personal, cheerful, and ready for real life.</p>",
    config: {
      layout: "feature",
      eyebrow: "The Kawaii point of view",
      image_path: imagePath("orchard-story"),
      image_alt: "A braided hairstyle among pink orchard blossoms",
      image_label: "Style story",
      image_value: "Joy in every detail",
      cta_label: "Discover our story",
      cta_url: "/about-us",
      cards: [
        {
          id: "soft-shapes",
          icon: "shirt",
          label: "Soft silhouettes",
          detail: "Comfortable from morning to evening",
        },
        {
          id: "easy-layers",
          icon: "layers",
          label: "Easy layers",
          detail: "Simple to style your own way",
        },
        {
          id: "playful-details",
          icon: "sparkles",
          label: "Playful details",
          detail: "A charming finish to every look",
        },
      ],
    },
  },
  {
    id: "kawaii-preview-reviews-section",
    type: "reviews",
    title: "Notes from the Kawaii community",
    subtitle: "Kind words from customers wearing their new favorites.",
    body: null,
    config: {
      eyebrow: "Loved in real life",
      limit: 4,
      cta_label: "Read all reviews",
      ...reviewLabels,
    },
  },
  {
    id: "kawaii-preview-promo-section",
    type: "promo",
    title: "A little extra sparkle.",
    subtitle: "Take 15% off selected accessories and finishing touches.",
    body: null,
    config: {
      promotion_id: promotion._id,
      cta_label: "Shop the special edit",
      cta_url: "/product",
      image_path: imagePath("braided-promo"),
      image_alt: "Braided style special edit",
      ...promoLabels,
    },
  },
  {
    id: "kawaii-preview-guarantees-section",
    type: "guarantees",
    title: null,
    subtitle: null,
    body: null,
    config: {
      accessible_label: "Shopping guarantees",
      items: [
        {
          title: "Carefully packed",
          body: "Prepared with attention, from us to you.",
        },
        {
          title: "Secure checkout",
          body: "A simple and protected shopping experience.",
        },
        {
          title: "Here to help",
          body: "Friendly support before and after your order.",
        },
      ],
    },
  },
  {
    id: "kawaii-preview-studio-notes-section",
    type: "studio_notes",
    title: "New edits, style stories, and lovely little surprises.",
    subtitle:
      "Join our list to hear about fresh arrivals and special collections.",
    body: null,
    config: {
      eyebrow: "Notes from the studio",
      cta_label: "Join our list",
      cta_url: "/contact-us",
    },
  },
];

export const KAWAII_FASHION_PREVIEW_DATA: HomepageRendererData = {
  banners,
  bannersV2: banners,
  categories,
  products,
  reviews,
  promotions: [promotion],
};
