import "server-only";

export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL?.trim() ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY?.trim() ?? "";
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}
