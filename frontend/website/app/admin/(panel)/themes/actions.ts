"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, isAdmin } from "@/lib/admin/auth";
import { writeAuditLog } from "@/lib/admin/auditLog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createDefaultStorefrontThemeConfig,
  getStorefrontThemeManifest,
  normalizeStorefrontThemeConfigWithResult,
  resolveStorefrontThemeTokens,
  STOREFRONT_CONTENT_REFERENCES,
  STOREFRONT_THEME_REGISTRY,
  type StorefrontThemeConfig,
} from "@/lib/theme/manifest";

export interface ThemeActionResult {
  error?: string;
  revision?: number;
}

function validateVersion(value: number): string | null {
  return Number.isSafeInteger(value) && value > 0
    ? null
    : "Expected draft version is invalid.";
}

function actionError(error: { message: string; code?: string }): string {
  if (
    error.code === "40001" ||
    /version conflict|revision conflict|stale|concurrent/i.test(error.message)
  ) {
    return "The theme changed in another session. Refresh the page and try again.";
  }
  if (/function.*does not exist|schema cache/i.test(error.message)) {
    return "The theme database functions are unavailable. Apply the storefront theme migration and retry.";
  }
  return `Theme update failed: ${error.message}`;
}

function resultRevision(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const result = data as Record<string, unknown>;
  const value = result.published ?? result.draft ?? result;
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  const revision = Number(row.revision_number ?? row.revision);
  return Number.isSafeInteger(revision) ? revision : undefined;
}

function normalizePrimary(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

function revalidatePublishedTheme() {
  revalidatePath("/admin/themes");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/about");
  revalidatePath("/about-us");
  revalidatePath("/", "layout");
}

export async function applyStorefrontTheme(input: {
  themeId: string;
  primary: string;
  expectedVersion: number;
}): Promise<ThemeActionResult> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can apply themes." };
  }

  const versionError = validateVersion(input?.expectedVersion);
  if (versionError) return { error: versionError };
  const manifest =
    typeof input?.themeId === "string"
      ? STOREFRONT_THEME_REGISTRY[input.themeId]
      : undefined;
  if (!manifest || manifest.id !== input.themeId) {
    return { error: "Choose a valid storefront theme." };
  }
  const primary = normalizePrimary(input.primary);
  if (!primary) {
    return { error: "Choose a valid six-digit primary color." };
  }

  const candidate = createDefaultStorefrontThemeConfig(manifest);
  candidate.tokenOverrides = { palette: { primary } };
  const normalized = normalizeStorefrontThemeConfigWithResult(candidate);
  if (
    normalized.usedFallback ||
    normalized.errors.length > 0 ||
    normalized.config.themeId !== manifest.id ||
    normalized.config.themeVersion !== manifest.version ||
    normalized.config.tokenOverrides.palette?.primary !== primary
  ) {
    return { error: "Theme configuration is invalid." };
  }

  const config = normalized.config;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("apply_theme", {
    p_expected_version: input.expectedVersion,
    p_theme_key: manifest.id,
    p_schema_version: config.schemaVersion,
    p_manifest: { id: manifest.id, version: manifest.version },
    p_design_config: {
      tokenOverrides: config.tokenOverrides,
      resolvedTokens: resolveStorefrontThemeTokens(config),
      contentReferences: STOREFRONT_CONTENT_REFERENCES,
    },
  });
  if (error) return { error: actionError(error) };

  const revision = resultRevision(data);
  await writeAuditLog({
    actor: session,
    action: "publish",
    entity: "storefront_theme",
    entityId: manifest.id,
    summary: `Applied and published ${manifest.id} storefront theme`,
    metadata: {
      themeId: manifest.id,
      primary,
      expectedVersion: input.expectedVersion,
      revision,
    },
  });
  revalidatePublishedTheme();
  revalidatePath(`/admin/themes/${manifest.id}`);
  return { revision };
}

export async function saveStorefrontThemeDraft(input: {
  config: StorefrontThemeConfig;
  expectedVersion: number;
}): Promise<ThemeActionResult> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can save theme drafts." };
  }
  const versionError = validateVersion(input.expectedVersion);
  if (versionError) return { error: versionError };
  const normalized = normalizeStorefrontThemeConfigWithResult(input.config);
  if (normalized.usedFallback || normalized.errors.length) {
    return {
      error: `Theme configuration is invalid. ${normalized.errors.join(" ")}`,
    };
  }
  const primary = normalized.config.tokenOverrides.palette?.primary;
  const config: StorefrontThemeConfig = {
    ...normalized.config,
    tokenOverrides: primary ? { palette: { primary } } : {},
  };
  const manifest = getStorefrontThemeManifest(
    config.themeId,
    config.themeVersion,
  );
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_theme_draft", {
    p_expected_version: input.expectedVersion,
    p_theme_key: manifest.id,
    p_schema_version: config.schemaVersion,
    p_manifest: { id: manifest.id, version: manifest.version },
    p_design_config: {
      tokenOverrides: config.tokenOverrides,
      resolvedTokens: resolveStorefrontThemeTokens(config),
      contentReferences: STOREFRONT_CONTENT_REFERENCES,
    },
  });
  if (error) return { error: actionError(error) };
  const revision = resultRevision(data);
  await writeAuditLog({
    actor: session,
    action: "update",
    entity: "storefront_theme",
    entityId: manifest.id,
    summary: `Saved ${manifest.id} theme draft`,
    metadata: {
      themeId: manifest.id,
      expectedVersion: input.expectedVersion,
      revision,
    },
  });
  return { revision };
}

export async function publishStorefrontThemeDraft(input: {
  expectedVersion: number;
}): Promise<ThemeActionResult> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can publish themes." };
  }
  const versionError = validateVersion(input.expectedVersion);
  if (versionError) return { error: versionError };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("publish_theme_draft", {
    p_expected_version: input.expectedVersion,
  });
  if (error) return { error: actionError(error) };
  const revision = resultRevision(data);
  await writeAuditLog({
    actor: session,
    action: "publish",
    entity: "storefront_theme",
    entityId: String(revision ?? input.expectedVersion),
    summary: "Published storefront theme draft",
    metadata: { expectedVersion: input.expectedVersion, revision },
  });
  revalidatePublishedTheme();
  return { revision };
}

export async function rollbackStorefrontTheme(input: {
  targetRevisionId: string;
  targetRevision: number;
  expectedVersion: number;
}): Promise<ThemeActionResult> {
  const session = await requireAdminSession();
  if (!isAdmin(session.role)) {
    return { error: "Only administrators can roll back themes." };
  }
  const versionError = validateVersion(input.expectedVersion);
  if (versionError) return { error: versionError };
  if (!input.targetRevisionId || input.targetRevision < 1) {
    return { error: "Choose a valid published revision to restore." };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rollback_theme_revision", {
    p_revision_id: input.targetRevisionId,
    p_expected_version: input.expectedVersion,
  });
  if (error) return { error: actionError(error) };
  const revision = resultRevision(data);
  await writeAuditLog({
    actor: session,
    action: "rollback",
    entity: "storefront_theme",
    entityId: input.targetRevisionId,
    summary: `Rolled storefront theme back to revision ${input.targetRevision}`,
    metadata: {
      targetRevision: input.targetRevision,
      expectedVersion: input.expectedVersion,
      revision,
    },
  });
  revalidatePublishedTheme();
  return { revision };
}
