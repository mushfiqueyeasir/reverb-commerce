# VE Gear Client Backup

`environment.backup.json` is a plaintext repository backup of the local VE Gear
environment files. The storefront, provisioning scripts, and Vercel deployment
do not load it at runtime.

Regenerate it after changing either local environment file:

```bash
cd backend
npm run client:env:backup -- --client ve-gear
```

The generated JSON preserves every variable from:

- `frontend/website/.env`
- `frontend/website/.env.ve-gear`

Continue configuring production values in Vercel. This file exists only for
repository-based recovery on another development machine.
