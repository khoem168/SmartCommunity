const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// This internal service can start without credentials while it is unused.
const bot = token && chatId ? new TelegramBot(token, { polling: false }) : null;
app.use(express.json());

app.post("/alert/payment-success", async (req, res) => {
  if (!bot) {
    return res.status(503).json({ error: "Telegram alerts are not configured" });
  }
  const { user, amount, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ error: "amount and orderId are required" });
  }

  const message =
    `✅ Payment Success\n` +
    `User: ${user || "Unknown"}\n` +
    `Order ID: ${orderId}\n` +
    `Amount: ${amount}`;

  try {
    await bot.sendMessage(chatId, message);
    return res.json({ success: true, message: "Telegram alert sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send Telegram alert" });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Telegram payment alert bot is running" });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Telegram bot server listening on http://localhost:${port}`);
  });
}

module.exports = app;
