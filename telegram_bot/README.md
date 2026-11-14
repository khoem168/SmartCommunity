# Telegram Bot

A small Node.js Telegram bot to send payment success alerts.

## Setup

1. Navigate to `telegram_bot/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
4. Run `npm start`.

Standalone development uses port 4001 so it does not conflict with the backend.
In Vercel Services this service stays internal: no public rewrite and no callers
or bindings are configured. It does not poll Telegram or send alerts on startup.
Missing credentials do not prevent startup; alert requests return HTTP 503 until
credentials are configured. See [the deployment guide](../VERCEL_DEPLOYMENT.md).

## API

- `POST /alert/payment-success`
  - body: `{ "user": "Name", "amount": "100.00", "orderId": "12345" }`

- `GET /`
  - health check endpoint.
