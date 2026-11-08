# PayPal ContextMatic Plugin Usage

Date: 2026-11-08
Plugin: PayPal Server SDK, TypeScript (APIMatic ContextMatic review)

This document records how the APIMatic ContextMatic plugin was used to review and validate the existing PayPal integration in this project. No code changes resulted from this review. The plugin was used as a contract and guidance check, not as a migration step.

Not yet tested: a real PayPal Sandbox payment has not yet been run end to end because sandbox credentials were not available.

An `update_activity` call recorded the first-call milestone during this review.

## Tools used and returned results

### 1) `fetch_api`

Tool used: `context-matic-fetch_api`

Input: API key `paypal`, language `typescript`

Returned: the PayPal Server SDK identity and description. The plugin confirmed the SDK is the PayPal Server SDK for TypeScript and described the core API coverage as Orders, Payments, Vault, Transaction Search, and Subscriptions.

### 2) `ask`

Tool used: `context-matic-ask`

Input: a question asking how to create and capture a PayPal order with the TypeScript Server SDK, including the relevant request/response models and error handling.

Returned: a TypeScript example showing `OrdersController.createOrder(...)` followed by `OrdersController.captureOrder(...)`, with `ApiError` / `CustomError` handling and a note that the expected error model is `CustomError`. The response also linked to the CreateOrder and CaptureOrder endpoints and pointed to the `Order` model and error docs.

### 3) `endpoint_search` for `createOrder`

Tool used: `context-matic-endpoint_search`

Input: query `createOrder`

Returned: the PayPal Orders v2 CreateOrder endpoint summary, request parameters, response type, and exception list. The plugin confirmed the method is `OrdersController.createOrder` with a request body of `OrderRequest`, `prefer: 'return=minimal'`, and returns an `Order` object. It also documented the expected errors for `400`, `401`, and `422` as `CustomError` variants.

### 4) `endpoint_search` for `captureOrder`

Tool used: `context-matic-endpoint_search`

Input: query `captureOrder`

Returned: the PayPal Orders v2 CaptureOrder endpoint summary, request parameters, response type, and exception list. The plugin confirmed the method is `OrdersController.captureOrder`, takes the order `id` and optional `prefer`, and returns an `Order` model with captured payment details. It also documented errors for `400`, `401`, `403`, `404`, `422`, and `500` as `CustomError` variants.

### 5) `model_search` for `ApiError`

Tool used: `context-matic-model_search`

Input: model `ApiError`

Returned: no exact model match was found; the plugin's guidance describes `ApiError` as the thrown SDK error and `CustomError` as a more specific error model. The tool surfaced similar error types, notably `CustomError` and `DefaultError`, and confirmed that PayPal error handling is framed around these typed SDK exceptions.

### 6) `model_search` for `Order`

Tool used: `context-matic-model_search`

Input: model `Order`

Returned: an exact match. The `Order` model includes `id`, `status`, `intent`, `purchaseUnits`, `links`, and related PayPal order metadata. This aligned with the order lifecycle used by the app’s custom fetch-based flow.

### 7) `model_search` for `CapturedPayment`

Tool used: `context-matic-model_search`

Input: model `CapturedPayment`

Returned: an exact match. The `CapturedPayment` model includes the capture lifecycle fields such as `status`, `id`, `amount`, `finalCapture`, `statusDetails`, `sellerProtection`, `links`, and capture timestamps. This matched the data the application validates when checking whether a PayPal capture is complete.

## Files reviewed

The review covered the existing PayPal integration and repository layers:

- `src/lib/paypal/client.ts`
- `src/lib/paypal/payments.ts`
- `src/lib/repo/demo.ts`
- `src/lib/repo/types.ts`
- `src/app/api/paypal/orders/route.ts`
- `src/app/api/paypal/orders/[id]/capture/route.ts`
- `src/app/api/paypal/orders/[id]/cancel/route.ts`

## Differences found between the existing fetch-based integration and the SDK guidance

The project currently uses a custom fetch-based PayPal integration, built around these patterns:

- OAuth token acquisition with `fetch` against `/v1/oauth2/token`
- direct REST calls to `/v2/checkout/orders` and `/v2/checkout/orders/:id/capture`
- homegrown error handling via `PaypalApiError`
- explicit `zod` validation and custom logic to verify captured amounts and currencies
- custom state transitions via repository functions and request locking

The plugin guidance, by contrast, expects the PayPal Server SDK pattern:

- `new Client(...)` with `OrdersController`
- `ordersController.createOrder({ body, prefer })`
- `ordersController.captureOrder({ id, prefer })`
- structured `ApiError` / `CustomError` catches and documented endpoint contract shapes
- `Order` and `CapturedPayment` model-based response handling

The main differences are procedural rather than functional:

1. The app validates PayPal responses with `zod` and business rules in `src/lib/paypal/client.ts` and `src/lib/paypal/payments.ts`, while the SDK guidance treats these as typed SDK responses that are consumed with controller methods.
2. The app manually enforces amount, currency, and capture validity checks in `captureFromOrder`, while the SDK guidance is centered on strongly typed models and exception handling.
3. The app’s fetch implementation includes explicit token caching, uses `PayPal-Request-Id` for idempotent order/capture flows, and re-reads the order after an uncertain capture before marking the payment complete.

This review confirmed that the existing integration matches the underlying PayPal Orders API contract and is consistent with the documented `createOrder` / `captureOrder` flows; it does not require a code migration to satisfy the current contract.

## Decision

The project did not migrate to `@paypal/paypal-server-sdk` before the hackathon deadline.

Why:

- The current fetch-based implementation already works for the hackathon flow and is already wired to the app’s server routes and repository layer.
- The review confirmed the app’s integration matches the PayPal Orders API contract and the SDK guidance was used to validate, not replace, the existing implementation.
- A migration would have required reworking the server-side client and error handling surface while preserving the current behavior and demo flow, which would add risk and time without clear product gain before the deadline.
- The focus for the hackathon remained on delivering the working flow and validating the integration contract, not on a broad SDK refactor.

## Known limitation

The payment workflow currently uses in-memory payment state in `src/lib/repo/demo.ts`. The repository stores the demo payment-request state on `globalThis` via a session-scoped in-memory store, which means it is not durable across server restarts or multi-instance deployments.

This is a known limitation for this project and should be replaced with persistent storage before production use or a real multi-user deployment.

## Summary

The APIMatic ContextMatic plugin was used to review and validate the current PayPal integration against the official TypeScript Server SDK guidance. The review confirmed that the project’s fetch-based implementation is compatible with the PayPal Orders contract, and that no code changes were required as part of the review. The app remains on the current custom fetch flow until a later persistence and architecture milestone makes a structured SDK migration worthwhile.
