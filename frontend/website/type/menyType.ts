export interface MenuType {
  label: string;
  href?: string;
  items?: { label: string; href: string; depth?: number }[];
}
