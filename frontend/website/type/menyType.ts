export interface MenuLink {
  label: string;
  href: string;
  items?: MenuLink[];
  imageUrl?: string | null;
  isDefault?: boolean;
}

export interface MenuType extends MenuLink {
  kind?: "categories" | "links";
}
