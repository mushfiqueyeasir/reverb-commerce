"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AiShoppingAssistant from "./AiShoppingAssistant";
import ProductSearchResults from "./ProductSearchResults";
import type { ProductSearchResult } from "@/type/productSearchType";

interface SearchSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchSidebar({
  open,
  onOpenChange,
}: SearchSidebarProps) {
  const [searchQuery, setLocalSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLocalSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
    }
  }, [open]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!open || activeTab !== "search" || !query) {
      setSearchResults([]);
      setSearchPending(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchPending(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/products/search?query=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          products?: ProductSearchResult[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Product search failed.");
        }
        setSearchResults(payload.products ?? []);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setSearchResults([]);
        setSearchError(
          requestError instanceof Error
            ? requestError.message
            : "Product search failed.",
        );
      } finally {
        if (!controller.signal.aborted) setSearchPending(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeTab, open, searchQuery]);

  const handleClear = () => {
    setLocalSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-[100dvh] max-h-none min-h-0 w-full overflow-hidden border-0 bg-background p-0 outline-none focus:outline-none focus-visible:outline-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Discover products</SheetTitle>
          <SheetDescription>
            Search or get an AI recommendation.
          </SheetDescription>
        </SheetHeader>

        <div className="pointer-events-none absolute inset-0 bg-grid opacity-35 [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_72%)]" />
        <div
          className="pointer-events-none absolute -left-48 -top-48 size-[38rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--primary-rgb) / 0.8), transparent 66%)",
          }}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="relative z-10 mx-auto grid h-full w-full max-w-[1600px] min-h-0 grid-rows-[auto_1fr] px-4 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[19rem_1fr] lg:grid-rows-1 lg:px-10 lg:pt-10"
        >
          <aside className="flex flex-col border-b border-border/80 pb-4 lg:min-h-0 lg:border-b-0 lg:border-r lg:pb-8 lg:pr-8">
            <div className="pr-12 lg:pr-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                Discovery / Active inventory
              </p>
              <h1 className="mt-2 max-w-sm font-display text-3xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-4xl lg:mt-5 lg:text-6xl">
                Find your
                <span className="block text-primary">signal.</span>
              </h1>
              <p className="mt-3 hidden max-w-[15rem] text-sm leading-6 text-muted-foreground lg:block">
                Search products directly or ask the shopping advisor to find the
                right active product for your needs.
              </p>
            </div>

            <TabsList className="mt-4 grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 text-left lg:mt-10 lg:grid-cols-1">
              <TabsTrigger
                value="search"
                className="group h-auto min-w-0 justify-start gap-3 rounded-xl border border-border bg-background/40 px-3 py-3 text-left shadow-none backdrop-blur-md data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none lg:rounded-none lg:border-x-0 lg:border-b lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-5 lg:backdrop-blur-none lg:data-[state=active]:bg-transparent lg:data-[state=active]:text-foreground"
              >
                <span className="font-mono text-[10px] opacity-60">01</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold tracking-tight sm:text-base">
                    Search
                  </span>
                  <span className="mt-0.5 hidden text-[11px] font-normal text-muted-foreground group-data-[state=active]:text-current/70 lg:block">
                    You know the name
                  </span>
                </span>
                <Search className="ml-auto size-4 shrink-0" />
              </TabsTrigger>
              <TabsTrigger
                value="advisor"
                className="group h-auto min-w-0 justify-start gap-3 rounded-xl border border-border bg-background/40 px-3 py-3 text-left shadow-none backdrop-blur-md data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none lg:rounded-none lg:border-x-0 lg:border-b lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-5 lg:backdrop-blur-none lg:data-[state=active]:bg-transparent lg:data-[state=active]:text-foreground"
              >
                <span className="font-mono text-[10px] opacity-60">02</span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold tracking-tight sm:text-base">
                    Ask AI
                  </span>
                  <span className="mt-0.5 hidden text-[11px] font-normal text-muted-foreground group-data-[state=active]:text-current/70 lg:block">
                    Product recommendations
                  </span>
                </span>
                <Sparkles className="ml-auto size-4 shrink-0" />
              </TabsTrigger>
            </TabsList>

            <div className="mt-auto hidden items-center gap-2 pt-8 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground lg:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Active inventory connected
            </div>
          </aside>

          <TabsContent
            value="search"
            className="scrollbar-hide m-0 min-h-0 overflow-y-auto focus-visible:ring-0 lg:px-10 xl:px-16"
          >
            <div className="mx-auto max-w-6xl pb-24 pt-7 sm:pt-10 lg:pb-16 lg:pt-2">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    01 / Direct search
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                    Search the collection.
                  </h2>
                </div>
                <p className="hidden max-w-[13rem] text-right text-xs leading-5 text-muted-foreground sm:block">
                  Results stay here until you choose where to go.
                </p>
              </div>

              <div className="group relative mt-8 border-b border-foreground/25 transition-colors focus-within:border-primary sm:mt-12">
                <Search className="absolute left-0 top-1/2 size-5 -translate-y-1/2 text-primary sm:size-6" />
                <input
                  type="text"
                  placeholder="Type a product name"
                  value={searchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-5 pl-9 pr-14 font-display text-2xl font-semibold tracking-tight outline-none placeholder:text-foreground/20 sm:py-7 sm:pl-12 sm:text-4xl"
                  autoFocus={activeTab === "search"}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-0 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <ProductSearchResults
                query={searchQuery}
                products={searchResults}
                pending={searchPending}
                error={searchError}
                onSelect={() => onOpenChange(false)}
              />

              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setActiveTab("advisor")}
                  className="group relative mt-10 flex w-full items-end justify-between gap-6 overflow-hidden border border-border bg-card/40 p-5 text-left transition duration-500 hover:border-primary sm:mt-14 sm:p-8"
                >
                  <span
                    className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full opacity-0 blur-3xl transition duration-700 group-hover:opacity-30"
                    style={{ background: "var(--primary)" }}
                  />
                  <span className="relative">
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-primary">
                      Need help choosing a product?
                    </span>
                    <span className="mt-2 block font-display text-2xl font-bold tracking-tight sm:text-4xl">
                      Ask the shopping advisor.
                    </span>
                    <span className="mt-2 block max-w-lg text-sm leading-6 text-muted-foreground">
                      Describe your needs, preferences, concern, or budget and
                      get recommendations from the active inventory.
                    </span>
                  </span>
                  <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-border transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:size-14">
                    <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </button>
              )}
            </div>
          </TabsContent>
          <TabsContent
            value="advisor"
            className="m-0 min-h-0 overflow-hidden focus-visible:ring-0 lg:px-10 xl:px-16"
          >
            <AiShoppingAssistant onProductSelect={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
