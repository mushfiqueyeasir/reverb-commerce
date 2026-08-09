"use client";

import { createContext, useContext } from "react";

const StoreBrandContext = createContext("Store");

export function StoreBrandProvider({
  storeName,
  children,
}: {
  storeName: string;
  children: React.ReactNode;
}) {
  return (
    <StoreBrandContext value={storeName.trim() || "Store"}>
      {children}
    </StoreBrandContext>
  );
}

export function useStoreName(): string {
  return useContext(StoreBrandContext);
}
