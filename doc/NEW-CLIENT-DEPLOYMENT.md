# New Client Store Provisioning

New stores are created with the `Provision customer store` GitHub Actions
workflow. The workflow creates isolated Supabase and Vercel projects, installs
the current schema and sample content, connects Vercel DNS, verifies the store,
and registers the client on `main`.

## One-time GitHub environment

Create a protected GitHub Environment named `store-provisioning` with required
reviewers.

Environment secrets:

```text
SUPABASE_ACCESS_TOKEN
VERCEL_TOKEN
BOOTSTRAP_ADMIN_PASSWORD
```

Environment variables:

```text
SUPABASE_ORG_SLUG
SUPABASE_INSTANCE_SIZE          # optional
VERCEL_TEAM_ID
VERCEL_GIT_REPOSITORY           # defaults to mushfiqueyeasir/reverb-commerce
BOOTSTRAP_ADMIN_EMAIL           # defaults to mushfiqueyeasir@gmail.com
```

The Vercel GitHub App must have access to the repository. The workflow token
must be allowed to push the final non-secret registry commit to `main`.

Asset cleanup also reads `SUPABASE_ACCESS_TOKEN` as a repository or environment
secret and derives each registered project's server key at runtime.

## Domain prerequisite

The customer must own the domain and delegate it to Vercel DNS before the
workflow can complete. The canonical and alias inputs must be HTTPS origins
without paths, query strings, or fragments.

Example:

```text
Canonical: https://www.example.com
Alias:     https://example.com
```

The alias receives a permanent redirect to the canonical hostname.

## Run the workflow

Open Actions, select `Provision customer store`, and choose `Run workflow`.

Required customer inputs include:

```text
Client ID
Store name
Canonical site URL
Currency and shipping defaults
Supabase region
Confirmation: PROVISION <client-id>
```

Use `provision` for a new customer. Use `resume` only after a partial run of the
same workflow left matching `store-<client-id>` resources.

## Created resources

The workflow performs these stages in order:

1. Validate source, tests, build, inputs, and registered ownership.
2. Create and wait for Supabase `store-<client-id>`.
3. Apply the clean baseline and every numbered migration through the latest version.
4. Record migration SHA-256 checksums in `provisioning.schema_migrations`.
5. Upload deterministic PNG placeholder assets to all storefront buckets.
6. Seed sample catalog and content without orders, customers, or payments.
7. Disable public signup and create the explicit bootstrap administrator.
8. Create Vercel `store-<client-id>` and configure Production variables.
9. Deploy the selected commit, attach domains, and wait for DNS and TLS.
10. Run health and storefront smoke tests.
11. Commit `backend/clients/<client-id>` directly to `main`.

The final client directory contains:

```text
tenant.json
deployment.json
environment.backup.json
README.md
```

`environment.backup.json` is a non-secret inventory. The Supabase Management
token and service-role/server key are always blank. It is rejected before the
registry commit if either privileged field contains a value.

## Setup mode

New deployments receive `STORE_SETUP_MODE=true`. While enabled:

- Search engines are told not to index the site.
- Checkout API requests return `503` and cannot create orders.
- Administrators can replace sample content and integration settings.

After onboarding, change `STORE_SETUP_MODE` to `false` in the customer's Vercel
Production environment and redeploy.

Before launch, replace placeholder legal text, products, reviews, branding,
contact details, shipping, SMTP, payment, courier, analytics, and chat settings.

## Local development

Set `SUPABASE_ACCESS_TOKEN` in the local shell or provide ignored
`.client-secrets/<client-id>.env`, then run:

```text
cd backend
npm run client:env:pull -- --client <client-id>

cd ../frontend/website
npm run dev:client -- <client-id>
```

The generated `frontend/website/.env.<client-id>` is ignored and contains the
runtime credentials needed by server-side application code.

## Failure and resume

The workflow never automatically deletes a partially created project. A failed
run preserves external resources and reports the failed stage. Correct the
underlying problem and rerun with `mode=resume`.

Registration happens only after successful domain and application smoke tests.
If the final push fails, external resources remain ready and the resume run can
finish registration without creating duplicates.

## Release behavior

Every customer Vercel project is connected to `main`. Frontend-affecting pushes
therefore deploy every store. Registry commits use `[skip ci]` and affected
project detection to avoid rebuilding stores for metadata-only changes.

Database changes used by application code must remain backward-compatible and
be applied fleet-wide before removing compatibility paths.
