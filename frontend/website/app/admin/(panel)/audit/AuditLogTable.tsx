"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminList } from "@/components/admin/AdminList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/admin/format";
import type { AuditLogRow } from "@/type/db";

const ACTION_VARIANT: Record<
  string,
  "default" | "info" | "secondary" | "destructive" | "warning" | "success"
> = {
  create: "success",
  update: "info",
  delete: "destructive",
  reorder: "secondary",
  toggle: "warning",
  status_change: "default",
  login: "success",
  logout: "secondary",
  login_failed: "destructive",
};

const KNOWN_ENTITIES = [
  "about_section",
  "auth",
  "banner",
  "category",
  "contact",
  "customer",
  "homepage_section",
  "inventory",
  "order",
  "page",
  "product",
  "promo_code",
  "promotion",
  "review",
  "security",
  "settings",
  "shipment",
  "user",
];

const KNOWN_ACTIONS = [
  "create",
  "delete",
  "login",
  "login_failed",
  "logout",
  "reorder",
  "status_change",
  "toggle",
  "update",
];

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export function AuditLogTable({
  data,
  page,
  pageSize,
  total,
  entityFilter,
  actionFilter,
  actorFilter,
  userEmails,
}: {
  data: AuditLogRow[];
  page: number;
  pageSize: number;
  total: number;
  entityFilter: string;
  actionFilter: string;
  actorFilter: string;
  userEmails: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const entities = useMemo(
    () =>
      [
        ...new Set([
          ...KNOWN_ENTITIES,
          ...data.map((row) => row.entity),
          entityFilter,
        ]),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [data, entityFilter],
  );
  const actions = useMemo(
    () =>
      [
        ...new Set([
          ...KNOWN_ACTIONS,
          ...data.map((row) => row.action),
          actionFilter,
        ]),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [data, actionFilter],
  );
  const actors = useMemo(
    () =>
      [...new Set([...userEmails, actorFilter])]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [actorFilter, userEmails],
  );

  const updateFilter = (name: "entity" | "action" | "actor", value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") next.set(name, value);
    else next.delete(name);
    next.delete("page");
    const query = next.toString();
    startTransition(() =>
      router.push(`${pathname}${query ? `?${query}` : ""}`),
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");
    const query = next.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={entityFilter || "all"}
          onValueChange={(value) => updateFilter("entity", value)}
          disabled={isPending}
        >
          <SelectTrigger className="h-10 w-[11rem] rounded-full">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((entity) => (
              <SelectItem key={entity} value={entity} className="capitalize">
                {labelize(entity)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actionFilter || "all"}
          onValueChange={(value) => updateFilter("action", value)}
          disabled={isPending}
        >
          <SelectTrigger className="h-10 w-[11rem] rounded-full">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action} className="capitalize">
                {labelize(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={actorFilter || "all"}
          onValueChange={(value) => updateFilter("actor", value)}
          disabled={isPending}
        >
          <SelectTrigger className="h-10 w-full min-w-0 rounded-full sm:w-[17rem]">
            <SelectValue placeholder="User email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {actors.map((email) => (
              <SelectItem key={email} value={email}>
                {email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {entityFilter || actionFilter || actorFilter ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => startTransition(() => router.push(pathname))}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <AdminList
        items={data}
        searchPlaceholder="Search this page…"
        searchFilter={(item, q) => {
          const hay = [
            item.summary,
            item.actor_email ?? "",
            item.entity,
            item.action,
            item.entity_id ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        }}
        emptyMessage="No audit events yet."
        renderTitle={(item) => item.summary}
        renderSubtitle={(item) => {
          const actor = item.actor_email
            ? `${item.actor_email}${item.actor_role ? ` · ${item.actor_role}` : ""}`
            : "Storefront / system";
          return `${formatDateTime(item.created_at)} · ${actor}`;
        }}
        renderMeta={(item) => (
          <>
            <Badge
              variant={ACTION_VARIANT[item.action] ?? "secondary"}
              className="capitalize"
            >
              {labelize(item.action)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {labelize(item.entity)}
            </Badge>
          </>
        )}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()}{" "}
          of {total.toLocaleString()} events
        </p>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>
                <ChevronLeft /> Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft /> Previous
            </Button>
          )}
          <span className="min-w-20 text-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>
                Next <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next <ChevronRight />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
