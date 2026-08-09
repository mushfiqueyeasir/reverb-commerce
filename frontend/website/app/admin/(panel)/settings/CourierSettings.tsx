"use client";

import Image from "next/image";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  adminInputClass,
} from "@/components/admin/FormField";
import {
  COURIER_META,
  COURIER_PROVIDERS,
  type CourierProvider,
} from "@/lib/couriers/metadata";
import type { CourierSettingsPublic } from "@/lib/couriers/types";
import { cn } from "@/lib/utils";

export type CourierProviderDraft = {
  sandbox: boolean;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  apiKey: string;
  secretKey: string;
  accessToken: string;
  pickupStoreId: string;
  webhookSecret: string;
  hasClientSecret: boolean;
  hasPassword: boolean;
  hasSecretKey: boolean;
  hasAccessToken: boolean;
};

export type CourierSettingsDraft = {
  activeProvider: CourierProvider | null;
  providers: Record<CourierProvider, CourierProviderDraft>;
};

export function courierDraftFromPublic(
  settings: CourierSettingsPublic,
): CourierSettingsDraft {
  return {
    activeProvider: settings.activeProvider,
    providers: Object.fromEntries(
      COURIER_PROVIDERS.map((provider) => {
        const value = settings.providers[provider];
        return [
          provider,
          {
            sandbox: value.sandbox,
            clientId: value.clientId ?? "",
            clientSecret: "",
            username: value.username ?? "",
            password: "",
            apiKey: value.apiKey ?? "",
            secretKey: "",
            accessToken: "",
            pickupStoreId: value.pickupStoreId ?? "",
            webhookSecret: value.webhookSecret ?? "",
            hasClientSecret: value.hasClientSecret,
            hasPassword: value.hasPassword,
            hasSecretKey: value.hasSecretKey,
            hasAccessToken: value.hasAccessToken,
          },
        ];
      }),
    ) as Record<CourierProvider, CourierProviderDraft>,
  };
}

export function CourierSettings({
  value,
  onChange,
  siteUrl,
}: {
  value: CourierSettingsDraft;
  onChange: (value: CourierSettingsDraft) => void;
  siteUrl: string;
}) {
  const update = (
    provider: CourierProvider,
    patch: Partial<CourierProviderDraft>,
  ) => {
    onChange({
      ...value,
      providers: {
        ...value.providers,
        [provider]: { ...value.providers[provider], ...patch },
      },
    });
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const origin = siteUrl.replace(/\/$/, "");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Choose the courier used for new shipments. Existing shipments keep
          their original courier and continue receiving updates.
        </p>
        {value.activeProvider === null ? (
          <p className="mt-2 text-sm font-medium text-amber-600">
            Courier service is currently disabled.
          </p>
        ) : null}
      </div>

      {COURIER_PROVIDERS.map((provider) => {
        const draft = value.providers[provider];
        const meta = COURIER_META[provider];
        const active = value.activeProvider === provider;
        const callbackBase = `${origin}/api/couriers/${provider}/webhook`;
        const callback =
          provider === "redx" && draft.webhookSecret
            ? `${callbackBase}?token=${encodeURIComponent(draft.webhookSecret)}`
            : callbackBase;

        return (
          <section
            key={provider}
            className={cn(
              "space-y-5 rounded-2xl border p-4 sm:p-5",
              active
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
                    width={100}
                    height={38}
                    className="max-h-8 w-auto max-w-full"
                  />
                </span>
                <div>
                  <p className="font-medium text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {active ? "Active for new shipments" : "Configured provider"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                variant={active ? "destructive" : "default"}
                className="min-w-44 rounded-full font-semibold"
                onClick={() =>
                  active
                    ? onChange({ ...value, activeProvider: null })
                    : onChange({
                        ...value,
                        activeProvider: provider,
                        providers: {
                          ...value.providers,
                          [provider]: {
                            ...draft,
                            webhookSecret:
                              draft.webhookSecret ||
                              crypto.randomUUID().replaceAll("-", ""),
                          },
                        },
                      })
                }
              >
                {active ? "Disable courier" : `Use ${meta.label}`}
              </Button>
            </div>

            {active ? (
              <>
            {provider !== "steadfast" ? (
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
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {provider === "pathao" ? (
                <>
                  <FormField label="Client ID">
                    <Input
                      value={draft.clientId}
                      onChange={(event) =>
                        update(provider, { clientId: event.target.value })
                      }
                      className={adminInputClass}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label="Client Secret"
                    hint={
                      draft.hasClientSecret && !draft.clientSecret
                        ? "Saved; leave blank to keep it."
                        : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={draft.clientSecret}
                      onChange={(event) =>
                        update(provider, { clientSecret: event.target.value })
                      }
                      placeholder={draft.hasClientSecret ? "••••••••••••" : ""}
                      className={adminInputClass}
                      autoComplete="new-password"
                    />
                  </FormField>
                  <FormField label="Merchant email / username">
                    <Input
                      value={draft.username}
                      onChange={(event) =>
                        update(provider, { username: event.target.value })
                      }
                      className={adminInputClass}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label="Merchant password"
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
                      placeholder={draft.hasPassword ? "••••••••••••" : ""}
                      className={adminInputClass}
                      autoComplete="new-password"
                    />
                  </FormField>
                </>
              ) : null}

              {provider === "steadfast" ? (
                <>
                  <FormField label="API Key">
                    <Input
                      value={draft.apiKey}
                      onChange={(event) =>
                        update(provider, { apiKey: event.target.value })
                      }
                      className={adminInputClass}
                      autoComplete="off"
                    />
                  </FormField>
                  <FormField
                    label="Secret Key"
                    hint={
                      draft.hasSecretKey && !draft.secretKey
                        ? "Saved; leave blank to keep it."
                        : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={draft.secretKey}
                      onChange={(event) =>
                        update(provider, { secretKey: event.target.value })
                      }
                      placeholder={draft.hasSecretKey ? "••••••••••••" : ""}
                      className={adminInputClass}
                      autoComplete="new-password"
                    />
                  </FormField>
                </>
              ) : null}

              {provider === "redx" ? (
                <FormField
                  label="API Access Token"
                  hint={
                    draft.hasAccessToken && !draft.accessToken
                      ? "Saved; leave blank to keep it."
                      : undefined
                  }
                >
                  <Input
                    type="password"
                    value={draft.accessToken}
                    onChange={(event) =>
                      update(provider, { accessToken: event.target.value })
                    }
                    placeholder={draft.hasAccessToken ? "••••••••••••" : ""}
                    className={adminInputClass}
                    autoComplete="new-password"
                  />
                </FormField>
              ) : null}

              {provider !== "steadfast" ? (
                <FormField label="Pickup Store ID">
                  <Input
                    value={draft.pickupStoreId}
                    onChange={(event) =>
                      update(provider, { pickupStoreId: event.target.value })
                    }
                    className={adminInputClass}
                    inputMode="numeric"
                  />
                </FormField>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Webhook</p>
                <p className="text-xs text-muted-foreground">
                  Register this callback and secret in the {meta.label} merchant
                  panel. Saving active settings verifies the API connection.
                </p>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={callback} className={adminInputClass} />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Copy ${meta.label} webhook URL`}
                  onClick={() => copy(callback)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <FormField
                label={
                  provider === "steadfast"
                    ? "Webhook bearer token"
                    : "Webhook secret"
                }
                hint="Save once to generate a secret, or enter your own."
              >
                <div className="flex gap-2">
                  <Input
                    value={draft.webhookSecret}
                    onChange={(event) =>
                      update(provider, { webhookSecret: event.target.value })
                    }
                    className={adminInputClass}
                    autoComplete="off"
                  />
                  {draft.webhookSecret ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label={`Copy ${meta.label} webhook secret`}
                      onClick={() => copy(draft.webhookSecret)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </FormField>
            </div>
              </>
            ) : (
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                This provider is inactive. Select "Use {meta.label}" to configure
                and activate it for new shipments.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
