"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FormField, adminInputClass } from "@/components/admin/FormField";
import { DatePickerField } from "@/components/admin/DatePickerField";
import type { PromoCodeRow } from "@/type/db";
import { savePromoCode } from "./actions";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tomorrowYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDateInput(d.toISOString());
}

export function PromoCodeDialog({
  promo,
  mode = "create",
}: {
  promo?: PromoCodeRow;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = mode === "edit" && !!promo;

  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [endsOn, setEndsOn] = useState(tomorrowYmd());
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (isEdit && promo) {
      setCode(promo.code);
      setPercent(String(promo.percent));
      setEndsOn(toDateInput(promo.ends_at));
      setActive(promo.active);
      return;
    }
    setCode("");
    setPercent("10");
    setEndsOn(tomorrowYmd());
    setActive(true);
  }, [open, isEdit, promo]);

  const onSubmit = () => {
    startTransition(async () => {
      const res = await savePromoCode({
        id: isEdit ? promo?.id : undefined,
        code,
        percent: Number(percent),
        endsOn,
        active,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(isEdit ? "Promo code updated" : "Promo code created");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Edit promo code"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="rounded-full">
            <Plus className="mr-2 size-4" />
            New promo code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit promo code" : "Create promo code"}
          </DialogTitle>
          <DialogDescription>
            Flat percent off the order subtotal (delivery charge is never
            discounted). Starts today
            {isEdit ? " from the original start date" : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <FormField label="Code" htmlFor="promo_code">
            <Input
              id="promo_code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="STORE10"
              className={adminInputClass}
              autoComplete="off"
            />
          </FormField>
          <FormField
            label="Discount percent"
            htmlFor="promo_percent"
            hint="Applied to products only — not delivery."
          >
            <Input
              id="promo_percent"
              type="number"
              min={1}
              max={100}
              step={1}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className={adminInputClass}
            />
          </FormField>
          <FormField
            label="Valid until"
            htmlFor="promo_ends"
            hint={
              isEdit
                ? `Started ${toDateInput(promo!.starts_at)}`
                : "Starts immediately from today."
            }
          >
            <DatePickerField
              id="promo_ends"
              value={endsOn}
              onChange={setEndsOn}
              placeholder="Choose end date"
              disablePast
            />
          </FormField>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive codes cannot be used at checkout.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={pending}
            className="rounded-full"
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
