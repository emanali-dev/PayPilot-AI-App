# PayPilot AI: project rules

Product: AI financial assistant for freelancers (PayPal AI Hackathon 2026).
Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4 (tokens in src/app/globals.css, no tailwind.config), Lucide, Recharts, Supabase, Gemini, PayPal REST Sandbox.

## Non-negotiable rules
- Do NOT recreate or restructure the project. Make the smallest change that works. When something breaks, fix only the affected files.
- Secrets (PayPal, Gemini, Supabase service role) are server-only. Never use NEXT_PUBLIC_ for secrets. Never log secrets.
- Never fake success. If an integration is unavailable, show an honest "Not connected" or error state. Demo data must always carry a visible "Demo data" label (DemoTag).
- Never mark a payment as paid from a frontend redirect. Only a verified PayPal capture response may set "completed".
- Gemini must not invent numbers. All figures come from deterministic server functions. Gemini only picks tools and explains results.
- Any payment-related action requires explicit user confirmation.
- Never collect bank passwords, OTPs or PINs.
- Money is stored as integer minor units. Validate every API input with zod.

## Design system (already implemented, reuse it)
Colours (CSS variables in globals.css, used as Tailwind tokens): background #101827, sidebar #141D2B, card #202B3B, elevated #263347, primary #3978F6, aqua #55C5E8, foreground #F5F7FB, muted-foreground #9AA9BC, success #2FB47C, warning #E3A33A, danger #D0605E.
Never hard-code hex values in components (charts excepted, matching the tokens). No light theme, no `dark:` variants.
Reuse: components/ui (Card, CardHeader, DemoTag, Badge, Button), components/layout (AppShell, PageHeader), components/dashboard/widgets. Radius 12-16px, subtle borders, no heavy glow, minimal animation, visible focus, respect reduced motion.

## Architecture
Route Handlers in src/app/api are the backend. Business logic in src/lib/services. Data access through a repository interface in src/lib/repo so the app works with demo data and with Supabase. Types in src/types. Tools for Gemini in src/lib/gemini.

## Workflow
After each task: run `npm run typecheck`, `npm run lint` and `npm run build`, fix errors, then summarise changed files. Do not start the next task until the build passes.