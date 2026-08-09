# Reverb Commerce Architecture

## Overview

Reverb Commerce uses one shared application repository while giving every client
an isolated production deployment and isolated Supabase project.

```mermaid
flowchart TB
    team[Reverb Solution Team]
    repo[(GitHub Repository)]
    actions[GitHub Actions Fleet Cleanup]

    subgraph shared[Shared Codebase]
        frontend[Next.js Storefront and Admin]
        backend[Provisioning and Fleet Scripts]
        migrations[Supabase Baseline and Migrations]
        registry[Client Registry]
    end

    subgraph clientA[Client A]
        domainA[Custom Domain]
        vercelA[Vercel Project]
        supabaseA[(Supabase Project)]
    end

    subgraph clientB[Client B]
        domainB[Custom Domain]
        vercelB[Vercel Project]
        supabaseB[(Supabase Project)]
    end

    subgraph clientN[Client N]
        domainN[Custom Domain]
        vercelN[Vercel Project]
        supabaseN[(Supabase Project)]
    end

    team --> repo
    repo --> shared
    repo --> actions
    frontend --> vercelA
    frontend --> vercelB
    frontend --> vercelN
    migrations --> supabaseA
    migrations --> supabaseB
    migrations --> supabaseN
    backend --> registry
    registry --> vercelA
    registry --> vercelB
    registry --> vercelN
    actions --> supabaseA
    actions --> supabaseB
    actions --> supabaseN
    domainA --> vercelA --> supabaseA
    domainB --> vercelB --> supabaseB
    domainN --> vercelN --> supabaseN
```

This model provides:

- One codebase and one production branch.
- One Vercel project per client.
- One Supabase database, authentication service, and storage account per client.
- One custom domain and independent environment configuration per client.
- The complete product feature set for every client.
- Fleet-wide automation without sharing client business data.

## Repository Structure

```text
frontend/website/                 Shared Next.js storefront and admin panel
backend/clients/<client-id>/      Non-secret tenant and deployment metadata
backend/scripts/                  Provisioning, validation, status, and cleanup
backend/supabase/                 Database baseline and migrations
ops/schemas/                      Tenant manifest schema
.github/workflows/                Fleet automation
.client-secrets/                  Ignored local provisioning credentials
doc/                              Architecture and operations documentation
```

## Per-Client Runtime

The browser communicates with the Next.js deployment. Supabase credentials are
server-only and are not included in browser bundles.

```mermaid
flowchart LR
    customer[Customer Browser]
    merchant[Merchant Browser]
    domain[Client Custom Domain]

    subgraph vercel[Vercel: Client Next.js Deployment]
        pages[Storefront and Admin UI]
        middleware[Admin Session Middleware]
        server[Server Components and Route Handlers]
        actions[Server Actions]
    end

    subgraph supabase[Supabase: Isolated Client Project]
        auth[Authentication]
        database[(Postgres Database)]
        storage[(Object Storage)]
        cron[pg_cron Scheduler]
    end

    payments[bKash]
    email[SMTP Provider]
    couriers[Pathao / Steadfast / REDX]

    customer --> domain
    merchant --> domain
    domain --> pages
    pages --> server
    merchant --> middleware
    middleware --> auth
    pages --> actions
    server --> database
    actions --> auth
    actions --> database
    actions -->|Temporary signed upload URL| storage
    merchant -->|Image body using signed URL| storage
    server --> payments
    server --> email
    actions -->|Create shipment / refresh status| couriers
    couriers -->|Authenticated status webhook| server
    cron -->|Delete expired unpaid gateway orders| database
```

### Order, Payment, and Courier Workflow

```mermaid
sequenceDiagram
    participant Customer
    participant Store as Next.js Store
    participant DB as Supabase Postgres
    participant Payment as bKash
    participant Merchant
    participant Courier as Active Courier API

    Customer->>Store: Submit checkout
    Store->>DB: Create order and reserve stock
    alt Cash on Delivery
        Store-->>Customer: Confirm order
    else Gateway payment
        Store->>Payment: Create hosted payment
        Payment-->>Store: Success or failure callback
        Store->>DB: Confirm paid order or delete failed order
        DB->>DB: Every 15 min delete unpaid gateway orders older than 1 hour
    end
    Merchant->>Store: Approve order
    Merchant->>Store: Send to active courier
    Store->>Courier: Create consignment
    Store->>DB: Store provider, tracking ID, and event
    Courier-->>Store: Authenticated status webhook
    Store->>DB: Deduplicate event and safely advance status
```

Exactly one courier can be active for new shipments, or all courier creation can
be disabled. Changing the active provider never migrates existing shipments:
`order_shipments.provider` permanently records the provider used for that order,
so old Pathao shipments continue to receive Pathao updates after REDX or
Steadfast becomes active.

Shipment creation is a deliberate merchant action available from both the order
list and order detail page. Pending orders can be approved from their list card;
confirmed or processing orders can then be sent to the active courier. COD
orders are eligible; bKash orders must be paid. Pathao and REDX require parcel weight, while REDX also
requires a provider delivery area.

Courier updates preserve the detailed provider status and event history. Safe
mapping only advances the main workflow to `processing`, `shipped`, or
`delivered`. Hold, failure, partial-delivery, approval-pending, return, and
unknown events never cancel, restock, or regress an order. Courier-linked orders
cannot be locally cancelled, moved to another provider, or deleted; customers
with linked orders are protected from cascading deletion.

### Runtime Security Boundary

| Location | Data | Tracked by Git |
| --- | --- | --- |
| `tenant.json` | Domain, project reference, schema version | Yes |
| `deployment.json` | Vercel and Supabase deployment metadata | Yes |
| `.client-secrets/<client-id>.env` | Supabase keys used for provisioning | No |
| `frontend/website/.env.<client-id>` | Local client runtime environment | No |
| Vercel environment | Production Supabase keys and site configuration | No |
| GitHub Actions secret | Supabase Management API token | No |
| Private database settings | SMTP, payment, courier credentials, active provider, webhook secrets | No |
| Browser runtime | UI code and temporary signed upload URLs | No permanent keys |

The anon key and service-role key are server-only environment variables. The
service-role client bypasses row-level security and must only be used by trusted
server code. Admin authentication uses server actions and cookie-bound sessions.

## Client Onboarding

Required input is documented in
[`NEW-CLIENT-DEPLOYMENT.md`](./NEW-CLIENT-DEPLOYMENT.md).

```mermaid
sequenceDiagram
    participant Operator
    participant Registry as Client Registry
    participant Supabase
    participant Provisioner
    participant Vercel
    participant DNS

    Operator->>Supabase: Create an empty isolated project
    Operator->>Registry: Add tenant.json
    Operator->>Registry: Add ignored local credentials
    Operator->>Supabase: Apply clean baseline and migrations
    Operator->>Provisioner: Run client validation
    Operator->>Provisioner: Provision client
    Provisioner->>Vercel: Create or adopt store-client-id
    Provisioner->>Vercel: Set server-only production environment
    Provisioner->>Vercel: Connect repository and deploy
    Provisioner->>Registry: Write non-secret deployment.json
    Operator->>DNS: Attach and verify production domain
    Operator->>Supabase: Create initial administrator
    Operator->>Vercel: Run production smoke tests
    Operator->>Registry: Mark client active
```

The provisioning script derives the Vercel project name as
`store-<client-id>`, uses `frontend/website` as the project root, deploys from
`main`, and records the resulting non-secret deployment metadata.

## Deployment Flow

```mermaid
flowchart LR
    commit[Commit on main]
    github[(GitHub)]
    projectA[Vercel Client A]
    projectB[Vercel Client B]
    projectN[Vercel Client N]
    smoke[Per-client Smoke Tests]

    commit --> github
    github --> projectA
    github --> projectB
    github --> projectN
    projectA --> smoke
    projectB --> smoke
    projectN --> smoke
```

All Vercel projects build the same source code. Client differences come from
the tenant's environment, database content, branding, domain, payment settings,
email settings, courier settings, and merchant-managed configuration.

## Abandoned Gateway-Order Cleanup

Migration `0018_abandoned_gateway_orders.sql` installs the database job
`cleanup-abandoned-gateway-orders` using `pg_cron`. It runs every 15 minutes and
deletes unpaid non-COD orders older than one hour. Explicitly failed or cancelled
gateway attempts are removed immediately by the callback path.

Deletion and variant-stock restoration execute in one transaction. Paid orders,
COD orders, recent gateway orders, and courier-linked orders are excluded. The
job uses row locking with `SKIP LOCKED`, allowing payment callbacks and cleanup
to operate safely without processing the same order concurrently. Migration
`0019_payment_courier_concurrency.sql` also claims an order as `processing`
before contacting bKash, reserves courier shipments while holding the order row
lock, and applies courier events through one transactional, monotonic RPC.

## Fleet Asset Cleanup

The cleanup workflow scales across the client registry without placing
credentials in its matrix payload.

```mermaid
flowchart TB
    dispatch[Manual Workflow Dispatch]
    discover[Read Active Client Folders]
    matrix[Dynamic Client Matrix]
    secret[SUPABASE_ACCESS_TOKEN]

    subgraph workers[Up to Five Concurrent Client Jobs]
        validate[Validate Tenant and Resolve Project Server Key]
        references[Collect All Referenced Paths with Pagination]
        objects[List All Storage Objects]
        protect[Exclude Referenced, Protected, and Recent Objects]
        result[Dry Run or Batched Delete]
    end

    dispatch --> discover --> matrix --> validate
    secret --> validate
    validate --> references --> objects --> protect --> result
```

Cleanup safety rules:

- Only clients with `status: active` are discovered.
- At most five clients run concurrently.
- One failed client does not stop other clients.
- The Management API token resolves each registered project's server key at runtime.
- Reference queries paginate to the exact row count.
- Required query, storage listing, and deletion errors fail the client job.
- Files newer than 24 hours are protected from deletion.
- Seed assets under protected prefixes are never deleted.
- Dry-run mode is the default.

## Scaling Model

Adding a client adds one registry folder, one Vercel project, and one Supabase
project. It does not add a source branch or application copy. The dynamic
cleanup matrix supports up to GitHub Actions' matrix limit and limits active
load with `max-parallel: 5`.

Application fixes are made once in the shared codebase and deployed across the
fleet. Database changes are delivered through versioned migrations and tracked
per client using the manifest's `schemaVersion`.
