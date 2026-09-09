// Read-only credential check. Never logs credentials or payment records.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);

async function main() {
  if (process.env.PAYMENT_PROVIDER !== "RAZORPAY") throw new Error("Set PAYMENT_PROVIDER=RAZORPAY in .env.");
  const key = (process.env.RAZORPAY_KEY_ID || "").trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!key || !secret) throw new Error("Missing Razorpay credentials. Add the actual RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env, not .env.example.");
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(key)) throw new Error("Invalid key ID format. Copy your actual generated key from the Razorpay Dashboard.");
  console.log(`Checking Razorpay ${key.startsWith("rzp_test_") ? "TEST" : "LIVE"} credentials (read-only; no payment is created)...`);
  const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Razorpay returned HTTP ${response.status}. Verify that the key ID and secret belong to the same account and mode.`);
  await response.body?.cancel();
  console.log("Credentials accepted. Restart the dev server, then use Online Payment > Pay Securely on a new checkout.");
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.log("Webhook secret is missing: configure it for payment recovery when the browser disconnects.");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
