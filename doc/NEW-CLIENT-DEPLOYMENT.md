# New Client Deployment

## Required Information

Provide the following for a production deployment:

```text
Store name:
Client ID: kebab-case, for example urban-rider
Primary domain: https://www.example.com
Domain aliases: https://example.com

Supabase project reference:
Supabase URL:
Supabase anon key:
Supabase service-role key:

Initial administrator name:
Initial administrator email:
```

The Supabase project must be empty. Domain DNS access is required when the
production domain is connected.

## Secret Handling

Never add Supabase keys to tracked files. Store them locally in:

```dotenv
# .client-secrets/<client-id>.env
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Add the service-role key to the `CLIENT_SUPABASE_CREDENTIALS` GitHub Actions
secret so automated cleanup can process the client.

## Automatically Configured

The deployment process creates or configures:

- `backend/clients/<client-id>/tenant.json`
- Vercel project `store-<client-id>`
- Production environment variables
- Database schema version `0019`
- Production deployment and domain attachment
- Automated asset cleanup registration

Every client receives the complete product feature set. Features are not
selected or tracked per tenant.

## Merchant Settings

After deployment, configure branding, contact details, shipping, SMTP, order
notification recipients, bKash credentials, courier credentials, analytics, and store content from
the administration panel. These values are not required to create the
deployment, but they are required before the store is launched to customers.

SMTP, payment, courier API, and courier webhook credentials are private database
settings. Do not put them in tenant manifests, Git, or browser-exposed
environment variables. Use the SMTP Test Connection action before enabling
customer mail.

## Integration Verification

1. Configure bKash and complete one approved low-value payment.
2. Confirm a failed payment removes its order and restores reserved stock.
3. Configure any required Pathao, Steadfast, or REDX accounts and select at most one active provider.
4. Register each provider webhook as `/api/couriers/<provider>/webhook` on the production domain and use a unique secret.
5. Approve a test order, send it to the active courier, and verify its tracking code and first event.
6. Verify a signed webhook or manual refresh updates courier history and safely advances the order.
7. Confirm a courier-linked order cannot be cancelled, sent to a different provider, or deleted locally.
8. Confirm `cleanup-abandoned-gateway-orders` is scheduled in `cron.job` every 15 minutes.

New projects use `backend/supabase/baselines/v1_0018_clean.sql`, then apply
`0019_payment_courier_concurrency.sql`. Existing projects apply migrations
`0017` through `0019` in order; they do not rerun the baseline.
