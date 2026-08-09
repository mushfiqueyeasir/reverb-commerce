import type { SeoContentType } from "@/type/seoType";
import { appConfig } from "@/lib/config";

const siteUrl = appConfig.siteUrl;

export const SeoContent: SeoContentType = {
  baseSeo: {
    title: "Store | Shop Online",
    description:
      "Browse products, discover new arrivals, and shop securely online.",
    image: "",
    siteUrl: `${siteUrl}`,
    keywords: [
      "Store",
      "Online Shopping",
      "New Arrivals",
      "Online Store",
      "Quality Products",
    ],
  },
  aboutUsSeo: {
    title: "About Us | Store",
    description:
      "Learn about our store, our values, and our commitment to quality products and service.",
    image: "",
    siteUrl: `${siteUrl}/about-us`,
    keywords: [
      "Store",
      "About Us",
      "Quality Products",
      "Brand Story",
      "Brand Mission",
    ],
  },
  productSeo: {
    title: "Shop | Store",
    description:
      "Explore our collection and shop new arrivals, featured products, and best sellers.",
    image: "",
    siteUrl: `${siteUrl}/product`,
    keywords: [
      "Store",
      "Collections",
      "Products",
      "New Drops",
      "Featured Products",
      "Online Shopping",
      "Best Sellers",
    ],
  },
  cartSeo: {
    title: "Shopping Cart | Store",
    description:
      "Review your selected items, continue shopping, or proceed to secure checkout.",
    image: "",
    siteUrl: `${siteUrl}/cart`,
    keywords: [
      "Store",
      "Shopping Cart",
      "Online Shopping",
      "E-commerce",
      "Shopping Bag",
    ],
  },
  wishlistSeo: {
    title: "Favorites | Store",
    description:
      "Your saved favorites are kept on this device so you can come back anytime.",
    image: "",
    siteUrl: `${siteUrl}/wishlist`,
    keywords: [
      "Store",
      "Favorites",
      "Wishlist",
      "Saved Products",
      "Online Shopping",
    ],
  },
  checkoutSeo: {
    title: "Checkout | Store",
    description: "Complete your purchase with a fast, secure checkout.",
    image: "",
    siteUrl: `${siteUrl}/checkout`,
    keywords: [
      "Store",
      "Checkout",
      "Secure Checkout",
      "Online Payment",
      "E-commerce",
    ],
  },
  contactUsSeo: {
    title: "Contact Us | Store",
    description:
      "Get in touch with our store for customer support, inquiries, or feedback.",
    image: "",
    siteUrl: `${siteUrl}/contact-us`,
    keywords: [
      "Store",
      "Contact Store",
      "Customer Support",
      "Inquiries",
      "Customer Service",
    ],
  },
  reviewsSeo: {
    title: "Customer Reviews | Store",
    description:
      "Read authentic customer reviews and see what customers say about their purchases.",
    image: "",
    siteUrl: `${siteUrl}/reviews`,
    keywords: [
      "Store",
      "Customer Reviews",
      "Product Reviews",
      "Customer Testimonials",
      "Community",
    ],
  },
  trackOrderSeo: {
    title: "Track Order | Store",
    description:
      "Track your order status using the order details from checkout or your confirmation email.",
    image: "",
    siteUrl: `${siteUrl}/track-order`,
    keywords: [
      "Store",
      "Track Order",
      "Order Status",
      "Order Tracking",
      "Delivery Status",
    ],
  },
  privacyPolicySeo: {
    title: "Privacy Policy | Store",
    description:
      "Read our privacy policy to understand how we collect, use, and protect personal information.",
    image: "",
    siteUrl: `${siteUrl}/privacy-policy`,
    keywords: [
      "Store",
      "Privacy Policy",
      "Data Protection",
      "Privacy",
      "Personal Information",
      "Cookies",
      "Data Security",
    ],
  },
  termsOfServiceSeo: {
    title: "Terms and Conditions | Store",
    description:
      "Read our terms and conditions covering products, pricing, shipping, returns, and intellectual property.",
    image: "",
    siteUrl: `${siteUrl}/terms-of-service`,
    keywords: [
      "Store",
      "Terms and Conditions",
      "Terms of Service",
      "User Agreement",
      "E-commerce Terms",
      "Legal Terms",
    ],
  },
  refundPolicySeo: {
    title: "Shipping & Return Policy | Store",
    description:
      "Learn about our shipping and return policy, delivery times, order tracking, and returns.",
    image: "",
    siteUrl: `${siteUrl}/refund-policy`,
    keywords: [
      "Store",
      "Shipping Policy",
      "Return Policy",
      "Refund Policy",
      "Order Tracking",
      "Shipping Fees",
    ],
  },
};
