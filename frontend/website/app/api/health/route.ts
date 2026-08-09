import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/config.server";
import { noStoreFetch } from "@/lib/supabase/noStoreFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const siteUrl = process.env.SITE_URL?.trim() ?? "";

  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !anonKey && "SUPABASE_ANON_KEY",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    !siteUrl && "SITE_URL",
  ].filter((name): name is string => Boolean(name));
  const invalid = [
    supabaseUrl && !isHttpUrl(supabaseUrl) && "SUPABASE_URL",
    siteUrl && !isHttpUrl(siteUrl) && "SITE_URL",
  ].filter((name): name is string => Boolean(name));

  const configuration =
    missing.length === 0 && invalid.length === 0
      ? { status: "ok" as const }
      : {
          status: "error" as const,
          ...(missing.length ? { missing } : {}),
          ...(invalid.length ? { invalid } : {}),
        };

  let database:
    { status: "ok" } | { status: "error" | "skipped"; message: string };

  if (!supabaseUrl || !anonKey || !isHttpUrl(supabaseUrl)) {
    database = {
      status: "skipped",
      message: "Supabase public configuration is unavailable.",
    };
  } else {
    try {
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: noStoreFetch },
      });
      const { data, error } = await supabase
        .from("site_settings")
        .select("id")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        database = {
          status: "error",
          message: "The site_settings connectivity check failed.",
        };
      } else if (!data) {
        database = {
          status: "error",
          message: "The site_settings singleton row is missing.",
        };
      } else {
        database = { status: "ok" };
      }
    } catch {
      database = {
        status: "error",
        message: "The site_settings connectivity check failed.",
      };
    }
  }

  const healthy = configuration.status === "ok" && database.status === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unhealthy",
      checks: { configuration, database },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
