# Client Registry

Each directory contains non-secret desired and deployed state for one isolated
storefront. Runtime credentials remain in Supabase, Vercel, protected GitHub
secrets, or ignored local files.

New clients are added by `.github/workflows/provision-store.yml` only after the
Supabase project, Vercel deployment, domains, and smoke tests succeed.

Every generated directory contains:

```text
tenant.json
deployment.json
environment.backup.json
README.md
```

`environment.backup.json` stores public configuration and blank placeholders
for privileged values. Never populate its access-token or service-role fields.

Validate the registry and inspect production deployment status with:

```text
cd backend
npm run client:validate
npm run fleet:status
```

## Local development

Set `SUPABASE_ACCESS_TOKEN` in your shell, or create ignored
`.client-secrets/<client-id>.env`, then run:

```text
cd backend
npm run client:env:pull -- --client <client-id>

cd ../frontend/website
npm run dev:client -- <client-id>
```

This creates ignored `frontend/website/.env.<client-id>`. Run the pull command
again after rotating project keys or changing Vercel configuration.

## Asset cleanup

GitHub Actions uses `SUPABASE_ACCESS_TOKEN` to resolve each registered project's
server key. No fleet-wide JSON map of service-role keys is required.
