"use client";

import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_NAVBAR,
  normalizeProductCardCopy,
  type ProductCardCopy,
} from "@/lib/cms/siteChrome";

const ProductCardCopyContext = createContext<ProductCardCopy>(
  structuredClone(DEFAULT_NAVBAR.productCardCopy),
);

export function ProductCardCopyProvider({
  copy,
  children,
}: {
  copy?: unknown;
  children: React.ReactNode;
}) {
  const value = useMemo(() => normalizeProductCardCopy(copy), [copy]);

  return (
    <ProductCardCopyContext.Provider value={value}>
      {children}
    </ProductCardCopyContext.Provider>
  );
}

export function useProductCardCopy(): ProductCardCopy {
  return useContext(ProductCardCopyContext);
}
