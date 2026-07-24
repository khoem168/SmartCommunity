const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });
app.use(express.json());

app.post("/alert/payment-success", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Telegram bot server listening on http://localhost:${port}`);
});
