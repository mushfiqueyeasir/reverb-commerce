# VE Gear Client Environment Inventory

`environment.backup.json` records environment variable names and non-secret
values. Management tokens, service-role keys, passwords, private keys, and
other secrets remain blank. The application does not load this file at runtime.

Regenerate it after changing either local environment file:

```bash
cd backend
npm run client:env:backup -- --client ve-gear
```

The generated JSON inventories variables from:

- `frontend/website/.env`
- `frontend/website/.env.ve-gear`

Continue configuring production values in Vercel. Use `client:env:pull` with a
Supabase Management API token to recreate a complete ignored local environment.
