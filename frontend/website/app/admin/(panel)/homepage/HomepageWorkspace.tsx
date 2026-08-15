"use client";

import type {
  HomepageRendererData,
  HomepageSectionRendererMapping,
} from "@/components/HomePage/HomepageRenderer";
import type { HomepageSectionRow } from "@/type/db";
import { HomepageTable } from "./HomepageTable";

export function HomepageWorkspace({
  sections,
  canWrite,
  themeId,
  themeName,
  rendererMapping,
  previewData,
}: {
  sections: HomepageSectionRow[];
  canWrite: boolean;
  themeId: string;
  themeName: string;
  rendererMapping: HomepageSectionRendererMapping;
  previewData: HomepageRendererData;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Drag sections into the order you want. Preview a design, show or hide
        it, or choose Edit to change its content.
      </p>
      <HomepageTable
        data={sections}
        canWrite={canWrite}
        themeId={themeId}
        themeName={themeName}
        rendererMapping={rendererMapping}
        previewData={previewData}
      />
    </div>
  );
}
