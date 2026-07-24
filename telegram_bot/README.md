# Telegram Bot

A small Node.js Telegram bot to send payment success alerts.

## Setup

1. Navigate to `telegram_bot/`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
4. Run `npm start`.

## API

- `POST /alert/payment-success`
  - body: `{ "user": "Name", "amount": "100.00", "orderId": "12345" }`

- `GET /`
  - health check endpoint.
