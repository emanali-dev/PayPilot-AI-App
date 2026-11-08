# PayPal Sandbox test procedure

The checkout uses the PayPal REST Orders v2 API. PayPal credentials and OAuth tokens are read only by server code; the browser receives an approval URL, not credentials. The app creates an order only after the user reviews and confirms the invoice and amount.

## References

- [PayPal REST authentication](https://developer.paypal.com/api/rest/authentication/)
- [PayPal Orders v2 API reference](https://developer.paypal.com/api/orders/v2/)
- [Official Orders v2 OpenAPI specification](https://github.com/paypal/paypal-rest-api-specifications/blob/main/openapi/checkout_orders_v2.json)

The integration uses `POST /v1/oauth2/token` with `grant_type=client_credentials`, `POST /v2/checkout/orders` with `intent: CAPTURE`, `GET /v2/checkout/orders/{id}`, and `POST /v2/checkout/orders/{id}/capture`. The capture request sends `PayPal-Request-Id` for idempotency. Only a verified `COMPLETED` response with the recorded invoice reference, amount, and currency completes the local transaction.

## Prerequisites

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), create a Sandbox REST app and copy its client ID and secret.
2. Create or select a Sandbox personal (buyer) test account and note its login credentials. Do not use a real PayPal password or account.
3. Configure the app's server environment (for example, in `.env.local`):

   ```dotenv
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=your-sandbox-client-id
   PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Restart the Next.js server after changing environment variables. Keep the buyer account separate from the Sandbox business account associated with the REST app. Do not commit `.env.local`.

## End-to-end test

1. Start the app with `npm run dev`, then open `http://localhost:3000/settings`. The PayPal Sandbox status should say **Connected** when both credentials are configured. This status indicates credentials are configured; it is not an API authorization test.
2. Open **Invoices** and choose **Request payment**. Pick a sent or overdue demo invoice and review its client, invoice number, due date, currency, and amount.
3. Select **Review payment request**. Confirm the summary, then choose **Create order and continue**. Before the PayPal redirect, the server records a pending payment request and transaction, creates a PayPal order, stores the order ID, and returns PayPal's approval URL.
4. Sign in with the Sandbox buyer account and approve the payment.
5. On return to `/pay/return`, wait for the server to retrieve the order and capture it. A completed result is shown only when PayPal reports `COMPLETED` and the captured amount, currency, and invoice reference match the stored request.
6. Open **Transactions** and **Invoices**. Confirm the transaction is **Completed** and the invoice is **paid**. Refresh the pages to confirm the same server process still has the in-memory updates.
7. Repeat with another unpaid invoice, but cancel at PayPal. `/pay/cancel` verifies the PayPal order before updating the transaction to **Cancelled**; the invoice stays unpaid.
8. For capture idempotency, repeat the same `POST /api/paypal/orders/{requestId}/capture` after a successful return. It should return the already completed record without processing a second capture.

## API input checks

- `POST /api/paypal/orders` accepts an invoice ID and an optional note. The server derives amount, currency, and client from the repository; client-supplied amounts are not accepted.
- A malformed request returns `400`. A paid, draft, void, or unknown invoice cannot be used to create an order.
- Without server-side credentials, order creation returns `503` and the UI clearly reports that PayPal is not connected.
- A request that PayPal cannot complete or that fails capture verification is never reported as paid. Temporary PayPal/API failures leave the request pending so verification can be retried.

## Demo-mode limitations

- Payment requests, orders, and transaction changes live in the Node process's in-memory repository. Restarting the process loses them. Run one app process for this demo; this storage is not suitable for deployment or concurrent serverless instances.
- Use a publicly reachable HTTPS app URL rather than localhost if the Sandbox buyer's browser cannot return to the local machine. Set `NEXT_PUBLIC_APP_URL` to that exact origin and restart the app.
- This phase does not include PayPal webhooks. A buyer who closes the browser before returning will leave the request pending until the return/capture flow is completed.
- Sandbox credentials and buyer accounts are required to test the external PayPal round trip. No real-money/live-mode test is part of this procedure.
