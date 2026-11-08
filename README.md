# PayPilot AI

AI financial assistant for freelancers: income, invoices, PayPal payments, cash flow.
Built for the PayPal AI Hackathon 2026.

## Run locally

Requires Node.js 20+ (22 recommended).

```bash
npm install
cp .env.example .env.local     # keep NEXT_PUBLIC_DEMO_MODE=true for now
npm run dev
```

Open http://localhost:3000 (redirects to /dashboard).
Check http://localhost:3000/api/health to see which integrations are configured.

## Add shadcn/ui components

`components.json` is already configured. Add components as you need them:

```bash
npx shadcn@latest add button card badge table input dialog sheet tabs sonner skeleton
```

## Supabase (when ready)

1. Create a project at supabase.com and copy the URL and keys into `.env.local`.
2. Open the SQL editor and run `supabase/migrations/0001_init.sql`.

## Scripts

`dev`, `build`, `start`, `lint`, `typecheck`

See `docs/ARCHITECTURE.md` for the architecture and roadmap.
