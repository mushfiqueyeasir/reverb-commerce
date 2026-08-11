import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productImageUrl } from "@/utility/imageUrl";
import type { ProductSearchResult } from "@/type/productSearchType";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface SearchProductRow {
  id: string;
  title: string;
  slug: string;
  original_price: number;
  current_price: number;
  product_images: {
    path: string;
    is_main: boolean;
    sort: number;
  }[];
}

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (!query) return NextResponse.json({ products: [] });
  if (query.length > 80) {
    return NextResponse.json(
      { error: "Search query is too long." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
          id, title, slug, original_price, current_price,
          product_images ( path, is_main, sort )
        `,
      )
      .eq("status", "active")
      .ilike("title", `%${escapeIlike(query)}%`)
      .limit(12);

    if (error) throw error;

    const products: ProductSearchResult[] = (
      (data as unknown as SearchProductRow[]) ?? []
    ).map((product) => {
      const images = [...product.product_images].sort(
        (a, b) => a.sort - b.sort,
      );
      const mainImage = images.find((image) => image.is_main) ?? images[0];

      return {
        id: product.id,
        title: product.title,
        href: `/product/${product.slug}`,
        image: productImageUrl(mainImage?.path) ?? "",
        currentPrice: Number(product.current_price),
        originalPrice: Number(product.original_price),
      };
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Product search is temporarily unavailable." },
      { status: 503 },
    );
  }
}
