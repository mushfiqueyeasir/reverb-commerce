import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/config.server";
import { noStoreFetch } from "./noStoreFetch";

// Service-role client. Bypasses RLS — server-only, never import in client code.
// Used for storefront order writes (place_order RPC) and privileged admin ops.
// Always uses cache: "no-store" so admin/store reads stay fresh.
export function createSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase admin client requires SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in the deployment environment.",
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}
