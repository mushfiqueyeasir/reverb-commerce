import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  StorefrontThemeRevisionRow,
  StorefrontThemeRevisionStatus,
} from "@/type/db";
import {
  createDefaultStorefrontThemeConfig,
  normalizeStorefrontThemeConfigWithResult,
  type StorefrontThemeConfig,
} from "./manifest";

export interface StorefrontThemeRevision {
  id: string | null;
  revisionNumber: number | null;
  version: number;
  status: StorefrontThemeRevisionStatus;
  config: StorefrontThemeConfig;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  normalizationErrors: string[];
  isFallback: boolean;
}

export interface StorefrontThemeWorkspace {
  published: StorefrontThemeRevision;
  draft: StorefrontThemeRevision | null;
  latestRevision: number;
  isEmpty: boolean;
}

export class StorefrontThemeStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorefrontThemeStoreError";
  }
}

function fallbackPublishedTheme(): StorefrontThemeRevision {
  return {
    id: null,
    revisionNumber: 0,
    version: 0,
    status: "published",
    config: createDefaultStorefrontThemeConfig(),
    createdAt: null,
    updatedAt: null,
    createdBy: null,
    publishedAt: null,
    publishedBy: null,
    normalizationErrors: [],
    isFallback: true,
  };
}

function normalizeRevisionRow(raw: unknown): StorefrontThemeRevision | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<StorefrontThemeRevisionRow>;
  if (
    typeof row.id !== "string" ||
    (row.status !== "draft" && row.status !== "published") ||
    !Number.isSafeInteger(row.version) ||
    Number(row.version) < 1 ||
    typeof row.theme_key !== "string" ||
    !Number.isSafeInteger(row.schema_version)
  ) {
    return null;
  }
  const revisionNumber =
    row.revision_number === null ? null : Number(row.revision_number);
  if (
    (row.status === "published" &&
      (!Number.isSafeInteger(revisionNumber) || Number(revisionNumber) < 1)) ||
    (row.status === "draft" && revisionNumber !== null)
  ) {
    return null;
  }
  const designConfig =
    row.design_config &&
    typeof row.design_config === "object" &&
    !Array.isArray(row.design_config)
      ? (row.design_config as Record<string, unknown>)
      : {};
  const manifestReference =
    row.manifest &&
    typeof row.manifest === "object" &&
    !Array.isArray(row.manifest)
      ? row.manifest
      : {};
  const referencedThemeId =
    manifestReference.id === row.theme_key ? row.theme_key : undefined;
  const result = normalizeStorefrontThemeConfigWithResult({
    schemaVersion: row.schema_version,
    themeId: referencedThemeId,
    themeVersion: manifestReference.version,
    tokenOverrides: designConfig.tokenOverrides,
  });
  return {
    id: row.id,
    revisionNumber,
    version: Number(row.version),
    status: row.status,
    config: result.config,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    createdBy: typeof row.created_by === "string" ? row.created_by : null,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    publishedBy: typeof row.published_by === "string" ? row.published_by : null,
    normalizationErrors: result.errors,
    isFallback: result.usedFallback,
  };
}

function actionableStoreError(message: string): StorefrontThemeStoreError {
  return new StorefrontThemeStoreError(
    `Unable to load storefront themes. Apply the storefront theme database migration and verify its RLS policies, then retry. Database: ${message}`,
  );
}

async function readRevisionRows(): Promise<StorefrontThemeRevision[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("theme_revisions")
    .select("*")
    .order("revision_number", { ascending: false, nullsFirst: false });
  if (error) throw actionableStoreError(error.message);
  const rows = (data ?? []).map(normalizeRevisionRow);
  if (rows.some((row) => row === null)) {
    throw new StorefrontThemeStoreError(
      "Storefront theme revisions contain invalid status, version, or revision values. Repair the affected rows and retry.",
    );
  }
  return rows as StorefrontThemeRevision[];
}

export const readCurrentPublishedStorefrontTheme = cache(
  async (): Promise<StorefrontThemeRevision> => {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: state, error: stateError } = await supabase
        .from("theme_state")
        .select("published_revision_id")
        .eq("singleton", true)
        .maybeSingle();
      if (stateError || !state?.published_revision_id) {
        return fallbackPublishedTheme();
      }
      const { data, error } = await supabase
        .from("theme_revisions")
        .select("*")
        .eq("id", state.published_revision_id)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) return fallbackPublishedTheme();
      return normalizeRevisionRow(data) ?? fallbackPublishedTheme();
    } catch {
      return fallbackPublishedTheme();
    }
  },
);

export async function readStorefrontThemeWorkspace(): Promise<StorefrontThemeWorkspace> {
  const rows = await readRevisionRows();
  const publishedRows = rows.filter((row) => row.status === "published");
  const published = publishedRows[0] ?? fallbackPublishedTheme();
  const draft = rows.find((row) => row.status === "draft") ?? null;
  return {
    published,
    draft,
    latestRevision: published.revisionNumber ?? 0,
    isEmpty: rows.length === 0,
  };
}

export async function readStorefrontThemeHistory(): Promise<
  StorefrontThemeRevision[]
> {
  const rows = await readRevisionRows();
  return rows.filter((row) => row.status === "published");
}
