"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, PackageCheck, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, adminInputClass } from "@/components/admin/FormField";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/admin/format";
import { COURIER_META, type CourierProvider } from "@/lib/couriers/metadata";
import type { CourierEventRow, OrderShipmentRow, OrderStatus } from "@/type/db";
import {
  createCourierShipment,
  refreshCourierShipment,
  searchCourierAreas,
} from "../actions";
import type { CourierArea } from "@/lib/couriers/types";

export function CourierShipmentControl({
  orderId,
  orderStatus,
  activeProvider,
  shipment,
  events,
  defaultAreaQuery,
  compact = false,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  activeProvider: CourierProvider | null;
  shipment: OrderShipmentRow | null;
  events: CourierEventRow[];
  defaultAreaQuery: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [searching, startSearch] = useTransition();
  const [weight, setWeight] = useState("0.5");
  const [instruction, setInstruction] = useState("");
  const [areaQuery, setAreaQuery] = useState(defaultAreaQuery);
  const [areas, setAreas] = useState<CourierArea[]>([]);
  const [areaId, setAreaId] = useState("");

  if (shipment) {
    const meta = COURIER_META[shipment.provider];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-20 place-items-center rounded-lg bg-white px-2">
              <Image
                src={meta.logo}
                alt={`${meta.label} logo`}
                width={72}
                height={30}
                className="max-h-7 w-auto max-w-full"
              />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {meta.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {shipment.tracking_code ||
                  shipment.external_id ||
                  "Sync pending"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {(shipment.courier_status || shipment.sync_state).replaceAll(
              "-",
              " ",
            )}
          </Badge>
        </div>

        {shipment.status_message ? (
          <p className="text-xs text-muted-foreground">
            {shipment.status_message}
          </p>
        ) : null}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={pending || !shipment.external_id}
          onClick={() =>
            startTransition(async () => {
              const result = await refreshCourierShipment(orderId);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              toast.success("Courier status refreshed");
              router.refresh();
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh status
        </Button>

        {events.length ? (
          <div className="space-y-3 border-t border-border pt-4">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="text-xs">
                <p className="font-medium capitalize text-foreground">
                  {(event.courier_status || event.event_name).replaceAll(
                    "-",
                    " ",
                  )}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(event.provider_time || event.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!activeProvider) {
    return (
      <p className="text-sm text-muted-foreground">
        No courier is active. Configure one in Settings → Commerce → Couriers.
      </p>
    );
  }

  const meta = COURIER_META[activeProvider];
  const eligible = orderStatus === "confirmed" || orderStatus === "processing";
  const selectedArea = areas.find((area) => area.id === areaId);

  const searchAreas = () => {
    startSearch(async () => {
      const result = await searchCourierAreas(areaQuery);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAreas(result.data ?? []);
      if (!result.data?.length) toast.error("No REDX areas found.");
    });
  };

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-20 place-items-center rounded-lg bg-white px-2">
            <Image
              src={meta.logo}
              alt={`${meta.label} logo`}
              width={72}
              height={30}
              className="max-h-7 w-auto max-w-full"
            />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{meta.label}</p>
            <p className="text-xs text-muted-foreground">
              Active for new shipments
            </p>
          </div>
        </div>
      ) : null}

      {!compact && !eligible ? (
        <p className="text-xs text-muted-foreground">
          Confirm the order before sending it to the courier.
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="rounded-full" disabled={!eligible}>
            <PackageCheck className="size-4" />
            Send to {meta.label}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send order to {meta.label}</DialogTitle>
            <DialogDescription>
              Review the parcel information. A successfully synced order cannot
              be deleted or moved to another courier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {activeProvider !== "steadfast" ? (
              <FormField
                label="Parcel weight (kg)"
                hint="Pathao and REDX accept parcels from 0.5 to 10 kg."
              >
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className={adminInputClass}
                />
              </FormField>
            ) : null}

            {activeProvider === "redx" ? (
              <>
                <FormField label="Find REDX delivery area">
                  <div className="flex gap-2">
                    <Input
                      value={areaQuery}
                      onChange={(event) => setAreaQuery(event.target.value)}
                      placeholder="District name"
                      className={adminInputClass}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={searching}
                      onClick={searchAreas}
                    >
                      {searching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      Search
                    </Button>
                  </div>
                </FormField>
                <FormField label="Delivery area">
                  <Select value={areaId} onValueChange={setAreaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            ) : null}

            <FormField
              label="Delivery instruction"
              hint="Optional; sent to the courier."
            >
              <Input
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                className={adminInputClass}
                maxLength={250}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || (activeProvider === "redx" && !selectedArea)}
              onClick={() =>
                startTransition(async () => {
                  const result = await createCourierShipment(orderId, {
                    weightKg: Number(weight) || 0.5,
                    instruction,
                    deliveryAreaId: selectedArea?.id ?? null,
                    deliveryAreaName: selectedArea?.name ?? null,
                  });
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(`Order sent to ${meta.label}`);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Create shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
