export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: "Missing userId or email" });
  }

  try {
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${process.env.LEMON_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: email,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: `${process.env.APP_URL || "https://trade-journal-zeta-seven.vercel.app"}/?subscribed=true`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMON_STORE_ID,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: String(process.env.LEMON_VARIANT_ID),
              },
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Lemon Squeezy error:", JSON.stringify(data));
      return res.status(500).json({ error: "Failed to create checkout" });
    }

    const checkoutUrl = data?.data?.attributes?.url;
    return res.status(200).json({ url: checkoutUrl });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
