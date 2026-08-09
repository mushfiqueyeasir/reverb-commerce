// Frontend-facing category type. imageUrl is a resolved Supabase Storage URL.

export interface Category {
  _id: string;
  categoryName: string;
  categoryDescription?: string | null;
  imageUrl: string | null;
  isDefault: boolean;
  categoryUrl: {
    current: string;
  };
}
