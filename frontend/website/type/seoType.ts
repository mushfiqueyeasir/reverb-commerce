export interface SeoItemType {
  title: string;
  description: string;
  image: string;
  siteUrl: string;
  keywords?: string[];
  tags?: string[];
  copyright?: string;
}

export interface SeoContentType {
  baseSeo: SeoItemType;
  aboutUsSeo: SeoItemType;
  productSeo: SeoItemType;
  cartSeo: SeoItemType;
  wishlistSeo: SeoItemType;
  checkoutSeo: SeoItemType;
  contactUsSeo: SeoItemType;
  reviewsSeo: SeoItemType;
  trackOrderSeo: SeoItemType;
  privacyPolicySeo: SeoItemType;
  termsOfServiceSeo: SeoItemType;
  refundPolicySeo: SeoItemType;
}
