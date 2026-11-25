const dotenv = require("dotenv");
dotenv.config();

const telegram = require("../services/telegramService");
const { BOT_COMMANDS } = require("../controllers/telegramController");

const run = async () => {
  if (!telegram.isConfigured()) {
    console.error("Missing TELEGRAM_BOT_TOKEN in backend/.env");
    process.exit(1);
  }
  const publicBase = String(
    process.argv[2] || process.env.PUBLIC_APP_URL || "https://smartcommunity-one.vercel.app",
  ).replace(/\/+$/, "");
  const webhookUrl = `${publicBase}/api/telegram/webhook`;
  const secret = telegram.getWebhookSecret();

  console.log("Setting Telegram webhook to:", webhookUrl);
  const [me, wh, cmds] = await Promise.all([
    telegram.getMe(),
    telegram.setWebhook(webhookUrl, secret),
    telegram.setMyCommands(BOT_COMMANDS),
  ]);

  console.log("Bot:", me?.ok ? `@${me.result.username}` : me);
  console.log("Webhook:", wh);
  console.log("Commands:", cmds);
  console.log("Claim Code (send /claim <code> to bot if TELEGRAM_ADMIN_CHAT_ID is not yet set):", telegram.getClaimCode());
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
