"use client";

import { createContext, useContext } from "react";

const StoreBrandContext = createContext<{
  storeName: string;
  logoUrl: string | null;
}>({ storeName: "Store", logoUrl: null });

export function StoreBrandProvider({
  storeName,
  logoUrl,
  children,
}: {
  storeName: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <StoreBrandContext
      value={{
        storeName: storeName.trim() || "Store",
        logoUrl: logoUrl ?? null,
      }}
    >
      {children}
    </StoreBrandContext>
  );
}

export function useStoreName(): string {
  return useContext(StoreBrandContext).storeName;
}

export function useStoreLogo(): string | null {
  return useContext(StoreBrandContext).logoUrl;
}
