import { create } from "zustand";
import type { TransformedProduct } from "@/type/productType";
import type { Category } from "@/type/categoryType";
import { getDescendantSlugs } from "@/lib/categories/hierarchy";

interface ProductFilters {
  availability: string[];
  priceRange: {
    from: number | null;
    to: number | null;
  };
  categories: string[];
  searchQuery: string;
  sortBy: "featured" | "price-low" | "price-high" | "name-a-z" | "name-z-a";
}

interface ProductStore {
  filters: ProductFilters;
  setAvailability: (availability: string[]) => void;
  setPriceRange: (from: number | null, to: number | null) => void;
  setCategories: (categories: string[]) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSortBy: (sortBy: ProductFilters["sortBy"]) => void;
  resetFilters: () => void;
  getFilteredProducts: (
    products: TransformedProduct[],
    categories?: Category[],
  ) => TransformedProduct[];
}

const initialFilters: ProductFilters = {
  availability: [],
  priceRange: {
    from: null,
    to: null,
  },
  categories: [],
  searchQuery: "",
  sortBy: "featured",
};

export const useProductStore = create<ProductStore>((set, get) => ({
  filters: initialFilters,

  setAvailability: (availability) =>
    set((state) => ({
      filters: { ...state.filters, availability },
    })),

  setPriceRange: (from, to) =>
    set((state) => ({
      filters: {
        ...state.filters,
        priceRange: { from, to },
      },
    })),

  setCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),

  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery },
    })),

  setSortBy: (sortBy) =>
    set((state) => ({
      filters: { ...state.filters, sortBy },
    })),

  resetFilters: () =>
    set({
      filters: initialFilters,
    }),

  getFilteredProducts: (products, categories = []) => {
    const { filters } = get();
    let filtered = [...products];

    if (filters.searchQuery.trim().length > 0) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(query));
    }

    if (filters.availability.length > 0) {
      filtered = filtered.filter((p) => {
        const totalQuantity = p.stock.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        const isInStock = totalQuantity > 0;
        const isOutOfStock = totalQuantity === 0;

        if (filters.availability.includes("in-stock") && isInStock) {
          return true;
        }
        if (filters.availability.includes("out-of-stock") && isOutOfStock) {
          return true;
        }
        return false;
      });
    }

    if (filters.categories.length > 0) {
      const allowedSlugs = getDescendantSlugs(
        categories,
        filters.categories,
      );
      filtered = filtered.filter((p) =>
        p.categories.some((cat) =>
          allowedSlugs.has(cat.categoryUrl.current),
        ),
      );
    }

    if (filters.priceRange.from !== null) {
      filtered = filtered.filter(
        (p) => p.currentPrice >= filters.priceRange.from!,
      );
    }
    if (filters.priceRange.to !== null) {
      filtered = filtered.filter(
        (p) => p.currentPrice <= filters.priceRange.to!,
      );
    }

    if (filters.sortBy === "price-low") {
      filtered.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (filters.sortBy === "price-high") {
      filtered.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (filters.sortBy === "name-a-z") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === "name-z-a") {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    }

    return filtered;
  },
}));
