require("dotenv").config();
const db = require("../config/db");

(async () => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM users");
    console.log("users:", rows[0].cnt);
    process.exit(0);
  } catch (err) {
    console.error("DB check failed:", err.message);
    process.exit(1);
  }
})();
