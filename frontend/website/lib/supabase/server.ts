import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/config.server";
import { createNoStoreSupabaseFetch } from "./noStoreFetch";

// SSR Supabase client bound to the request cookies. Use in Server Components,
// Route Handlers, and Server Actions. In pure Server Components cookie writes
// are not allowed, so setAll is wrapped defensively.
// Always uses cache: "no-store" — catalog/CMS data changes frequently.
export async function createSupabaseServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    global: { fetch: createNoStoreSupabaseFetch(anonKey) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}
