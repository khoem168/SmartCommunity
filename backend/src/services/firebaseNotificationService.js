const { JWT } = require("google-auth-library");
const db = require("../config/db");

const firebaseConfigured = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );

const getAccessToken = async () => {
  const client = new JWT({
    email: process.env.FIREBASE_CLIENT_EMAIL,
    key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const credentials = await client.authorize();
  return credentials.access_token;
};

const sendFirebasePushToUser = async (userId, notification) => {
  if (!firebaseConfigured()) {
    return { configured: false, sent: 0, failed: 0 };
  }
  const [tokens] = await db.query(
    `SELECT id, token FROM notification_push_tokens
     WHERE user_id = ? AND provider = 'firebase' AND is_active = 1`,
    [userId],
  );
  if (!tokens.length) return { configured: true, sent: 0, failed: 0 };

  const accessToken = await getAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
    process.env.FIREBASE_PROJECT_ID,
  )}/messages:send`;
  const appUrl = (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
  let sent = 0;
  let failed = 0;

  for (const tokenRow of tokens) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: tokenRow.token,
          notification: {
            title: notification.title,
            body: notification.message || notification.title,
          },
          data: {
            type: notification.type,
            link: notification.link || "/notifications",
            notificationId: String(notification.id || ""),
          },
          webpush: {
            fcmOptions: {
              link: `${appUrl}${notification.link || "/notifications"}`,
            },
          },
        },
      }),
    });
    if (response.ok) {
      sent += 1;
      await db.query(
        "UPDATE notification_push_tokens SET last_used_at = NOW() WHERE id = ?",
        [tokenRow.id],
      );
    } else {
      failed += 1;
      const result = await response.text();
      if (
        response.status === 404 ||
        result.includes("UNREGISTERED") ||
        result.includes("INVALID_ARGUMENT")
      ) {
        await db.query(
          "UPDATE notification_push_tokens SET is_active = 0 WHERE id = ?",
          [tokenRow.id],
        );
      }
    }
  }
  return { configured: true, sent, failed };
};

module.exports = { firebaseConfigured, sendFirebasePushToUser };
