"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField, adminInputClass } from "@/components/admin/FormField";
import type { BkashSettingsPublic } from "@/lib/payments/bkashSettings";
import {
  PAYMENT_META,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
} from "@/lib/payments/metadata";
import { cn } from "@/lib/utils";

export type PaymentProviderDraft = {
  enabled: boolean;
  sandbox: boolean;
  username: string;
  password: string;
  appKey: string;
  appSecret: string;
  hasPassword: boolean;
  hasAppSecret: boolean;
};

export type PaymentSettingsDraft = {
  providers: Record<PaymentProvider, PaymentProviderDraft>;
};

export function paymentDraftFromPublic(
  bkash: BkashSettingsPublic,
): PaymentSettingsDraft {
  return {
    providers: {
      bkash: {
        enabled: bkash.enabled,
        sandbox: bkash.sandbox,
        username: bkash.username ?? "",
        password: "",
        appKey: bkash.appKey ?? "",
        appSecret: "",
        hasPassword: bkash.hasPassword,
        hasAppSecret: bkash.hasAppSecret,
      },
    },
  };
}

export function PaymentSettings({
  value,
  onChange,
  defaultCurrency,
}: {
  value: PaymentSettingsDraft;
  onChange: (value: PaymentSettingsDraft) => void;
  defaultCurrency: string;
}) {
  const update = (
    provider: PaymentProvider,
    patch: Partial<PaymentProviderDraft>,
  ) => {
    onChange({
      ...value,
      providers: {
        ...value.providers,
        [provider]: { ...value.providers[provider], ...patch },
      },
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Cash on delivery is always available. Enable and configure additional
        payment providers for checkout.
      </p>

      {PAYMENT_PROVIDERS.map((provider) => {
        const draft = value.providers[provider];
        const meta = PAYMENT_META[provider];
        const currencySupported = defaultCurrency === meta.requiredCurrency;

        return (
          <section
            key={provider}
            className={cn(
              "space-y-5 rounded-2xl border p-4 sm:p-5",
              draft.enabled
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card/50",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-28 place-items-center rounded-xl bg-white px-3 py-2">
                  <Image
                    src={meta.logo}
                    alt={`${meta.label} logo`}
                    width={115}
                    height={67}
                    className="max-h-9 w-auto max-w-full object-contain"
                  />
                </span>
                <div>
                  <p className="font-medium text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {draft.enabled ? "Active at checkout" : meta.description}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                variant={draft.enabled ? "destructive" : "default"}
                className="min-w-44 rounded-full font-semibold"
                onClick={() => update(provider, { enabled: !draft.enabled })}
              >
                {draft.enabled
                  ? `Disable ${meta.label}`
                  : `Enable ${meta.label}`}
              </Button>
            </div>

            {draft.enabled ? (
              <>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Sandbox mode</p>
                    <p className="text-xs text-muted-foreground">
                      Turn off only when live credentials are ready.
                    </p>
                  </div>
                  <Switch
                    checked={draft.sandbox}
                    onCheckedChange={(sandbox) => update(provider, { sandbox })}
                  />
                </div>

                {!currencySupported ? (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Default currency is {defaultCurrency}. Switch Commerce →
                    Currency to {meta.requiredCurrency} before offering{" "}
                    {meta.label}
                    at checkout.
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Username">
                    <Input
                      value={draft.username}
                      onChange={(event) =>
                        update(provider, { username: event.target.value })
                      }
                      placeholder="Merchant portal username"
                      className={adminInputClass}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label="Password"
                    hint={
                      draft.hasPassword && !draft.password
                        ? "Saved; leave blank to keep it."
                        : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={draft.password}
                      onChange={(event) =>
                        update(provider, { password: event.target.value })
                      }
                      placeholder={
                        draft.hasPassword ? "••••••••••••" : "Password"
                      }
                      className={adminInputClass}
                      autoComplete="new-password"
                    />
                  </FormField>
                  <FormField label="App Key">
                    <Input
                      value={draft.appKey}
                      onChange={(event) =>
                        update(provider, { appKey: event.target.value })
                      }
                      placeholder="x-app-key"
                      className={adminInputClass}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label="App Secret"
                    hint={
                      draft.hasAppSecret && !draft.appSecret
                        ? "Saved; leave blank to keep it."
                        : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={draft.appSecret}
                      onChange={(event) =>
                        update(provider, { appSecret: event.target.value })
                      }
                      placeholder={
                        draft.hasAppSecret ? "••••••••••••" : "App secret"
                      }
                      className={adminInputClass}
                      autoComplete="new-password"
                    />
                  </FormField>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable {meta.label} to configure its environment and merchant
                credentials.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
