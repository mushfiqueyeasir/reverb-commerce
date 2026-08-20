"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField, adminInputClass } from "@/components/admin/FormField";
import { cn } from "@/lib/utils";
import type { SmsSettingsPublic } from "@/lib/sms/settings";

export type SmsSettingsDraft = {
  enabled: boolean;
  senderId: string;
  apiKey: string;
  secretKey: string;
  checkoutOtp: boolean;
  hasApiKey: boolean;
  hasSecretKey: boolean;
};

export function smsDraftFromPublic(
  settings: SmsSettingsPublic,
): SmsSettingsDraft {
  return {
    enabled: settings.enabled,
    senderId: settings.senderId ?? "",
    apiKey: "",
    secretKey: "",
    checkoutOtp: settings.checkoutOtp,
    hasApiKey: settings.hasApiKey,
    hasSecretKey: settings.hasSecretKey,
  };
}

export function SmsSettings({
  value,
  onChange,
}: {
  value: SmsSettingsDraft;
  onChange: (value: SmsSettingsDraft) => void;
}) {
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);

  const update = (patch: Partial<SmsSettingsDraft>) => {
    onChange({ ...value, ...patch });
  };

  const sendTestSms = async () => {
    if (!testPhone.trim()) {
      toast.error("Enter a phone number to receive the test SMS.");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Test SMS failed.");
        return;
      }
      toast.success("Test SMS sent. Check the phone for the message.");
    } catch {
      toast.error("Could not send the test SMS. Check the connection.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Connect the Khudebarta bulk SMS gateway to send order verification codes
        (OTP) by SMS.
      </p>

      <section
        className={cn(
          "space-y-5 rounded-2xl border p-4 sm:p-5",
          value.enabled
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-card/50",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-28 place-items-center rounded-xl bg-white px-3 py-2">
              <Image
                src="/images/sms/khudebarta.png"
                alt="Khudebarta logo"
                width={115}
                height={67}
                className="max-h-8 w-auto max-w-full object-contain"
              />
            </span>
            <div>
              <p className="font-medium text-foreground">Khudebarta</p>
              <p className="text-xs text-muted-foreground">
                {value.enabled
                  ? "SMS gateway is active"
                  : "Bulk SMS gateway for Bangladesh"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            variant={value.enabled ? "destructive" : "default"}
            className="min-w-44 rounded-full font-semibold"
            onClick={() => {
              update({
                enabled: !value.enabled,
                checkoutOtp: value.enabled ? false : value.checkoutOtp,
              });
            }}
          >
            {value.enabled ? "Disable SMS" : "Enable SMS"}
          </Button>
        </div>

        {value.enabled ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Sender ID"
                hint="Masking name or numeric caller ID from your Khudebarta account."
              >
                <Input
                  value={value.senderId}
                  onChange={(event) => update({ senderId: event.target.value })}
                  placeholder="Sender ID"
                  className={adminInputClass}
                  autoComplete="off"
                />
              </FormField>
              <FormField label="API Key">
                <Input
                  value={value.apiKey}
                  onChange={(event) => update({ apiKey: event.target.value })}
                  placeholder="API key"
                  className={adminInputClass}
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label="Secret Key"
                hint={
                  value.hasSecretKey && !value.secretKey
                    ? "Saved; leave blank to keep it."
                    : undefined
                }
              >
                <Input
                  type="password"
                  value={value.secretKey}
                  onChange={(event) =>
                    update({ secretKey: event.target.value })
                  }
                  placeholder={
                    value.hasSecretKey ? "••••••••••••" : "Secret key"
                  }
                  className={adminInputClass}
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Verify orders with OTP</p>
                <p className="text-xs text-muted-foreground">
                  Require a one-time SMS code before placing checkout orders.
                </p>
              </div>
              <Switch
                checked={value.checkoutOtp}
                onCheckedChange={(checkoutOtp) => update({ checkoutOtp })}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Send test SMS
                </p>
                <p className="text-xs text-muted-foreground">
                  Verify the gateway connection by sending a short message to a
                  Bangladeshi mobile number.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={testPhone}
                  onChange={(event) => setTestPhone(event.target.value)}
                  placeholder="88017XXXXXXXX"
                  inputMode="tel"
                  className={adminInputClass}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  disabled={testing}
                  onClick={sendTestSms}
                >
                  {testing ? "Sending…" : "Send test SMS"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Enable the SMS gateway to configure its sender ID and API
            credentials.
          </p>
        )}
      </section>
    </div>
  );
}
