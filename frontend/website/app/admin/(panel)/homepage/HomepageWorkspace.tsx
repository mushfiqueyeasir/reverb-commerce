"use client";

import type { HomepageSectionRow } from "@/type/db";
import { HomepageTable } from "./HomepageTable";

export function HomepageWorkspace({
  sections,
  canWrite,
}: {
  sections: HomepageSectionRow[];
  canWrite: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Drag sections into the order you want. Preview a design, show or hide
        it, or choose Edit to change its content.
      </p>
      <HomepageTable data={sections} canWrite={canWrite} />
    </div>
  );
}
