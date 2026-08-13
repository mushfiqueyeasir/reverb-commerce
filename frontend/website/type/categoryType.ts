// Frontend-facing category type. imageUrl is a resolved Supabase Storage URL.

export interface Category {
  _id: string;
  categoryName: string;
  categoryDescription?: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sort: number;
  depth: number;
  isDefault: boolean;
  categoryUrl: {
    current: string;
  };
}
