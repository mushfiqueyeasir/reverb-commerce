import type {
  HomepageRendererData,
  HomepageRendererSection,
} from "@/components/HomePage/HomepageRenderer";
import type { Category } from "@/type/categoryType";
import type { TransformedProduct } from "@/type/productType";
import type { Promotion } from "@/type/promotionType";
import type { TransformedReview } from "@/type/reviewType";
import type { Banner } from "@/utility/getBanners";

const imagePath = (file: string) => `/images/themes/volt-gear/${file}.jpg`;

const bannerLabels = {
  edit_label: "MiniCo edit",
  footer_note: "Built to last · Everyday style",
  image_badge: "The new drop",
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
  default_badge: "New drop",
  product_list_label: "Featured products",
  uncategorized_label_template: "Look {number}",
};

const reviewLabels = {
  customer_fallback: "Verified customer",
  body_fallback: "A piece that keeps up with everyday life.",
  item_label_template: "Note {number}",
  verified_label: "Verified review",
  rating_aria_template: "{rating} out of {maximum} stars",
};

const promoLabels = {
  kicker: "This week’s pick",
  limited_label: "Limited drop",
  discount_suffix: "off",
  image_eyebrow: "Now in stock",
  image_title: "Made for everyday",
  cta_fallback_label: "Shop the drop",
};

const banners: Banner[] = [
  {
    id: "volt-gear-preview-banner",
    title: "Trendy mobile covers.",
    subtitle: "Protection and style for your everyday device",
    imageUrl: imagePath("hero-cases-dark"),
    mobileImageUrl: imagePath("hero-cases-elegant"),
    ctaLabel: "Shop covers",
    ctaUrl: "/product",
  },
];

const categoryDetails = [
  {
    name: "Mobile Covers",
    description: "Trendy covers and cases for every device.",
    image: "category-covers",
  },
  {
    name: "Accessories",
    description: "Chargers, cables, and everyday gadget add-ons.",
    image: "category-accessories",
  },
  {
    name: "Lifestyle Essentials",
    description: "Everyday essentials that make life easier.",
    image: "category-lifestyle",
  },
] as const;

const categories: Category[] = categoryDetails.map((category, index) => ({
  _id: `volt-gear-preview-category-${index}`,
  categoryName: category.name,
  categoryDescription: category.description,
  imageUrl: imagePath(category.image),
  parentId: null,
  sort: (index + 1) * 10,
  depth: 0,
  isDefault: false,
  categoryUrl: { current: `volt-gear-${index + 1}` },
}));

const productDetails = [
  {
    title: "Matte Shield Phone Cover",
    image: "category-covers",
    originalPrice: 450,
    currentPrice: 399,
    categoryIndex: 0,
  },
  {
    title: "Slim Fit Protective Case",
    image: "hero-cases-elegant",
    originalPrice: 550,
    currentPrice: 449,
    categoryIndex: 0,
  },
  {
    title: "Fast Wireless Charger",
    image: "gadget-flatlay",
    originalPrice: 999,
    currentPrice: 849,
    categoryIndex: 1,
  },
  {
    title: "Tough Rugged Cover",
    image: "hero-cases-dark",
    originalPrice: 599,
    currentPrice: 499,
    categoryIndex: 0,
  },
  {
    title: "Leather Everyday Case",
    image: "category-covers",
    originalPrice: 749,
    currentPrice: 649,
    categoryIndex: 0,
  },
  {
    title: "Phone Lens Kit",
    image: "category-accessories",
    originalPrice: 699,
    currentPrice: 549,
    categoryIndex: 1,
  },
  {
    title: "Desk Essential Kit",
    image: "category-lifestyle",
    originalPrice: 1299,
    currentPrice: 999,
    categoryIndex: 2,
  },
  {
    title: "Everyday Carry Set",
    image: "gadget-flatlay",
    originalPrice: 1599,
    currentPrice: 1299,
    categoryIndex: 2,
  },
] as const;

const products: TransformedProduct[] = productDetails.map((product, index) => {
  const category = categories[product.categoryIndex];
  const image = imagePath(product.image);

  return {
    id: `volt-gear-preview-product-${index}`,
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
    slug: `volt-gear-preview-${index}`,
    sizingMode: "none",
    stock: [
      {
        id: `volt-gear-preview-stock-${index}`,
        size: null,
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
    id: "volt-gear-preview-review-1",
    image: imagePath("hero-cases-dark"),
    customerName: "Tanvir Hasan",
    body: "The cover fits perfectly and the finish looks premium. Delivery was fast and the packaging was neat.",
    rating: 5,
  },
  {
    id: "volt-gear-preview-review-2",
    image: imagePath("category-covers"),
    customerName: "Nusrat Jahan",
    body: "Great quality charger and a very smooth ordering experience. I will definitely shop again.",
    rating: 5,
  },
  {
    id: "volt-gear-preview-review-3",
    image: imagePath("category-accessories"),
    customerName: "Rafiq Ahmed",
    body: "The case feels sturdy and looks better in person. Worth every taka.",
    rating: 5,
  },
];

const promotion: Promotion = {
  _id: "volt-gear-preview-promotion",
  title: "Everyday gear, made easier.",
  description: "Trendy covers, chargers, and gadget accessories from MiniCo.",
  imageUrl: imagePath("gadget-flatlay"),
  discountPercent: 20,
  ctaUrl: "/product",
  ctaLabel: "Shop the drop",
};

export const VOLT_GEAR_PREVIEW_SECTIONS: HomepageRendererSection[] = [
  {
    id: "volt-gear-preview-banner-section",
    type: "banner",
    title: null,
    subtitle: null,
    body: null,
    config: {
      description:
        "MiniCo is a Dhaka-based Facebook destination for mobile covers, chargers, and everyday gadget accessories in Bangladesh.",
      ...bannerLabels,
      show_marquee: true,
      stats: [
        { label: "Facebook likes", value: "7K+" },
        { label: "Public snapshot", value: "157 talking" },
        { label: "Based in", value: "Dhaka" },
        { label: "Focus", value: "Everyday gadgets" },
      ],
      marquee_items: [
        "TRENDY MOBILE COVERS",
        "CHARGERS & GADGETS",
        "EVERYDAY ACCESSORIES",
        "PREMIUM & DURABLE",
      ],
    },
  },
  {
    id: "volt-gear-preview-featured-section",
    type: "featured",
    title: "Everyday Gear, Featured",
    subtitle: "Six MiniCo picks for covers and everyday gadgets",
    body: null,
    config: {
      limit: 6,
      eyebrow: "Selected by MiniCo",
      cta_label: "Shop the collection",
      ...productLabels,
    },
  },
  {
    id: "volt-gear-preview-categories-section",
    type: "categories",
    title: "Explore the MiniCo Collection",
    subtitle: "Three ways to gear up your everyday carry",
    body: null,
    config: {
      eyebrow: "Premium & durable",
      cta_label: "Browse all products",
      category_ids: categories.map((category) => category._id),
      limit: 4,
    },
  },
  {
    id: "volt-gear-preview-richtext-section",
    type: "richtext",
    title: "Your Everyday Gadget Destination",
    subtitle: "MiniCo in Dhaka",
    body: "<p>MiniCo is a Dhaka Facebook page and an everyday gadget destination serving customers across Bangladesh. Follow the page for product updates and explore trendy mobile covers, chargers, and everyday accessories.</p>",
    config: {
      layout: "feature",
      eyebrow: "About MiniCo",
      image_path: imagePath("gadget-flatlay"),
      image_alt: "Everyday gadget accessories presented by MiniCo",
      image_label: "MiniCo style",
      image_value: "Everyday essentials",
      image_tag: "// DHAKA",
      cta_label: "Visit MiniCo on Facebook",
      cta_url: "https://www.facebook.com/minico11",
      copy_label: "MiniCo story",
      cards_label: "Public page snapshot",
      cards: [
        {
          id: "facebook-likes",
          icon: "sparkles",
          label: "7K+ likes",
          detail: "Public Facebook snapshot",
        },
        {
          id: "facebook-talking",
          icon: "zap",
          label: "157 talking",
          detail: "Public Facebook snapshot",
        },
      ],
    },
  },
  {
    id: "volt-gear-preview-reviews-section",
    type: "reviews",
    title: "From a MiniCo Customer",
    subtitle: "Published feedback from the MiniCo community",
    body: null,
    config: {
      eyebrow: "Customer review",
      limit: 3,
      cta_label: "Read reviews",
      ...reviewLabels,
    },
  },
  {
    id: "volt-gear-preview-promo-section",
    type: "promo",
    title: "Discover the Featured Collection",
    subtitle: "Everyday covers and gadget accessories from MiniCo",
    body: null,
    config: {
      promotion_id: promotion._id,
      cta_label: "Explore the collection",
      cta_url: "/product",
      image_path: imagePath("hero-cases-dark"),
      image_alt: "MiniCo phone cases and everyday gadget accessories",
      ...promoLabels,
    },
  },
];

export const VOLT_GEAR_PREVIEW_DATA: HomepageRendererData = {
  banners,
  bannersV2: banners,
  categories,
  products,
  reviews,
  promotions: [promotion],
};
