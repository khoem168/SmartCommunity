const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { BakongKHQR, IndividualInfo, khqrData } = require("bakong-khqr");

const localBakongEnv = path.resolve(
  __dirname,
  "../../../bakong-main/bakong-main/backend/.env",
);

if (fs.existsSync(localBakongEnv)) {
  dotenv.config({ path: localBakongEnv });
}

const getBakongConfig = () => {
  const config = {
    accountId: process.env.BAKONG_ACCOUNT_USERNAME?.trim(),
    accountName: process.env.BAKONG_ACCOUNT_NAME?.trim(),
    accessToken: process.env.BAKONG_ACCESS_TOKEN?.trim(),
    baseUrl: process.env.BAKONG_PROD_BASE_API_URL?.trim(),
    merchantCity: process.env.BAKONG_MERCHANT_CITY?.trim() || "PHNOM PENH",
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== "merchantCity" && !value)
    .map(([key]) => key);
  if (missing.length) {
    const error = new Error(
      "Bakong payment is not configured. Add the BAKONG_* environment variables.",
    );
    error.code = "BAKONG_NOT_CONFIGURED";
    throw error;
  }
  if (!config.accountId.includes("@")) {
    const error = new Error(
      "BAKONG_ACCOUNT_USERNAME must be a complete Bakong account ID.",
    );
    error.code = "BAKONG_ACCOUNT_INVALID";
    throw error;
  }
  return config;
};

const generateCourseKhqr = ({ amount, currency, courseTitle }) => {
  const config = getBakongConfig();
  const normalizedCurrency = String(currency).toUpperCase();
  const expirationTimestamp = Date.now() + 5 * 60 * 1000;
  const optionalData = {
    currency:
      normalizedCurrency === "KHR"
        ? khqrData.currency.khr
        : khqrData.currency.usd,
    amount: Number(amount),
    billNumber: `COURSE-${Date.now()}`,
    storeLabel: "SMART COMMUNITY",
    terminalLabel: String(courseTitle || "COURSE").slice(0, 25),
    expirationTimestamp,
  };
  const individualInfo = new IndividualInfo(
    config.accountId,
    config.accountName,
    config.merchantCity,
    optionalData,
  );
  const result = new BakongKHQR().generateIndividual(individualInfo);

  if (!result?.data?.qr || !result?.data?.md5) {
    const error = new Error(
      result?.error?.message || "Bakong could not generate a KHQR code.",
    );
    error.code = "KHQR_GENERATION_FAILED";
    throw error;
  }

  return {
    qrCode: result.data.qr,
    qrMd5: result.data.md5,
    expiresAt: new Date(expirationTimestamp),
    merchantName: config.accountName,
  };
};

const checkBakongTransaction = async (qrMd5) => {
  const config = getBakongConfig();
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const endpoint = baseUrl.endsWith("/v1")
    ? `${baseUrl}/check_transaction_by_md5`
    : `${baseUrl}/v1/check_transaction_by_md5`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ md5: qrMd5 }),
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = new Error(
      payload.responseMessage || payload.message || "Bakong verification failed.",
    );
    error.status = response.status;
    throw error;
  }
  if (payload.responseCode !== 0 || !payload.data?.hash) return null;
  return payload.data;
};

const normalizeBakongCurrency = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "840" || normalized === "USD") return "USD";
  if (normalized === "116" || normalized === "KHR") return "KHR";
  return normalized;
};

module.exports = {
  checkBakongTransaction,
  generateCourseKhqr,
  getBakongConfig,
  normalizeBakongCurrency,
};
