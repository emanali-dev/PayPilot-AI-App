# PayPilot AI: Architecture

## Principles
- One Next.js app (modular monolith). Route Handlers are the backend. No microservices.
- All secrets (PayPal, Gemini, Supabase service role) stay server-side.
- Gemini never touches the database or PayPal directly. It calls a small set of typed server functions ("tools").
- Any action with side effects (send invoice, send reminder) is proposed by the AI, then confirmed by the user.
- Money is stored as integer minor units.

## Pages
/dashboard (Overview), /assistant, /invoices, /transactions, /insights, /clients, /settings, /pay, /pay/return, /pay/cancel. Legacy `/payments` and `/cashflow` paths redirect to `/transactions` and `/insights`.

## API endpoints (Route Handlers)
| Route | Purpose | Needs credentials |
|---|---|---|
| GET /api/health | Integration status | none |
| POST /api/invoices | Create a validated draft invoice in the demo repository | none |
| POST /api/paypal/orders | Create a pending payment request and PayPal Orders v2 checkout | PayPal |
| POST /api/paypal/orders/[id]/capture | Retrieve/capture and verify a PayPal order before completing invoice/transaction | PayPal |
| POST /api/paypal/orders/[id]/cancel | Verify the order is not completed before marking it cancelled | PayPal |
| GET/POST /api/invoices, GET/PATCH /api/invoices/[id] | Persistent invoice CRUD | Supabase (planned) |
| POST /api/invoices/[id]/send | Create + send PayPal invoice | Supabase, PayPal |
| GET/POST /api/clients | Client CRUD | Supabase |
| GET /api/payments | List payments | Supabase |
| POST /api/paypal/sync | Pull recent transactions into DB | Supabase, PayPal |
| POST /api/paypal/webhook | Receive PayPal events | Supabase, PayPal |
| GET /api/analytics/summary, /cashflow | Aggregates for charts | Supabase |
| POST /api/assistant/chat | Chat with tool calling | Supabase, Gemini |
| POST /api/assistant/actions/[id]/confirm | Execute a proposed action | Supabase, Gemini/PayPal as needed |

## Folder responsibilities
- `src/app`: routes only; thin.
- `src/features/<name>`: feature UI (tables, forms, cards) and hooks.
- `src/components/ui`: shadcn primitives. `layout`: shell. `charts`: Recharts wrappers.
- `src/lib/repo`: typed data-access contract and the in-memory demo implementation; UI routes consume this boundary rather than demo seed data.
- `src/lib/services`: business logic (invoice totals, overdue detection, cash flow math). Pure and testable.
- `src/lib/paypal`: OAuth token cache, Invoicing API, Transactions API, webhook verification.
- `src/lib/gemini`: client, system prompt, tool declarations, tool executor.
- `src/lib/supabase`: clients and typed queries.
- `supabase/migrations`: SQL schema.

## Data flow
1. Demo UI routes -> typed repository -> in-memory, demo-seeded store. Invoice creation posts to `/api/invoices`; the new draft remains in the current server process memory.
2. PayPal checkout: user reviews invoice -> `/api/paypal/orders` creates a pending repository request and Orders v2 order -> buyer approves at PayPal -> `/pay/return` calls the server capture handler -> verified `COMPLETED` amount/currency/reference updates the transaction and invoice. Capture uses a stable `PayPal-Request-Id`; cancellation checks the PayPal order before changing local status.
3. Planned persistent UI flow -> Route Handler -> Supabase (user-scoped) -> JSON -> UI.
4. Invoice send: UI -> /api/invoices/[id]/send -> PayPal Invoicing API (sandbox) -> store paypal_invoice_id -> status "sent".
5. Payment webhook (planned): PayPal webhook -> verify signature -> store raw event (idempotent) -> upsert payment -> match invoice -> mark paid.
6. Assistant: UI -> /api/assistant/chat -> Gemini with tool declarations -> Gemini requests a tool (e.g. get_unpaid_invoices) -> server runs it against the repository -> result goes back to Gemini -> answer streams to UI.
7. Actions: Gemini calls propose_action -> row in pending_actions -> UI shows confirm card -> user confirms -> server executes via PayPal -> logged.

## Assistant tools (planned)
Read-only: get_income_summary, get_unpaid_invoices, get_cashflow_forecast, search_payments.
Proposals: propose_send_reminder, propose_create_invoice.

## Independent vs credential-dependent
Independent: UI shell, design system, schema, invoice/client CRUD (with demo data), analytics math, charts, assistant UI with mocked replies.
Needs Supabase: auth, persistence, RLS.
Needs PayPal sandbox: sending invoices, transaction sync, webhooks (webhooks also need a public URL such as ngrok).
Needs Gemini: assistant intelligence, natural-language invoice drafting, insight summaries.

## Roadmap
- M0 Foundation (done): scaffold, tokens, shell, schema, env handling.
- M1 Demo data layer: seed data, services, repository interface that can swap demo for Supabase.
- M2 Dashboard + Cash flow: KPI cards, income chart, outstanding vs paid, 30/60/90 forecast.
- M3 Supabase: auth, migrations applied, real CRUD for clients and invoices.
- M4 PayPal sandbox: OAuth, create/send invoice, sync transactions, webhook.
- M5 Gemini assistant: chat with read-only tools, streaming, saved conversations.
- M6 Assistant actions: propose -> confirm -> execute (reminders, create invoice).
- M7 Polish and submission: empty/error states, seed demo account, README, demo video, deploy to Vercel.
