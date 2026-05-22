import crypto from "crypto";

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function updateSupabase(userId, status, customerId, subscriptionId) {
  const url = `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      subscription_status: status,
      lemon_customer_id: customerId,
      lemon_subscription_id: subscriptionId,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Supabase update error:", text);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers["x-signature"];
  const secret = process.env.LEMON_WEBHOOK_SECRET;

  // Verify signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  if (digest !== signature) {
    console.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const customerId = String(payload.data?.attributes?.customer_id || "");
  const subscriptionId = String(payload.data?.id || "");

  console.log("Webhook event:", eventName, "userId:", userId);

  if (!userId) {
    return res.status(200).json({ received: true, note: "No user_id in custom_data" });
  }

  if (eventName === "subscription_created") {
    await updateSupabase(userId, "active", customerId, subscriptionId);
  } else if (eventName === "subscription_updated") {
    const status = payload.data?.attributes?.status;
    const mappedStatus = status === "active" ? "active" : "inactive";
    await updateSupabase(userId, mappedStatus, customerId, subscriptionId);
  } else if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    await updateSupabase(userId, "inactive", customerId, subscriptionId);
  }

  return res.status(200).json({ received: true });
}
