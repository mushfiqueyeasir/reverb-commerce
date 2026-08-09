"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CourierProvider } from "@/lib/couriers/metadata";
import type { OrderStatus } from "@/type/db";
import { updateOrderStatus } from "./actions";
import { CourierShipmentControl } from "./[id]/CourierShipmentControl";

export function OrderQuickActions({
  orderId,
  status,
  deliveryCity,
  hasShipment,
  activeProvider,
  canWrite,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryCity: string;
  hasShipment: boolean;
  activeProvider: CourierProvider | null;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [approving, startApproval] = useTransition();
  const canSend =
    canWrite &&
    !hasShipment &&
    activeProvider &&
    (status === "confirmed" || status === "processing");

  return (
    <>
      {canWrite && status === "pending" ? (
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          disabled={approving}
          onClick={() =>
            startApproval(async () => {
              const result = await updateOrderStatus(orderId, "confirmed");
              if (result.error) {
                toast.error(result.error);
                return;
              }
              toast.success("Order approved");
              router.refresh();
            })
          }
        >
          {approving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Approve
        </Button>
      ) : null}

      {canSend ? (
        <CourierShipmentControl
          orderId={orderId}
          orderStatus={status}
          activeProvider={activeProvider}
          shipment={null}
          events={[]}
          defaultAreaQuery={deliveryCity}
          compact
        />
      ) : null}

      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link href={`/admin/orders/${orderId}`}>View</Link>
      </Button>
    </>
  );
}
