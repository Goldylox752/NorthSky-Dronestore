import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔒 safer mapping instead of dynamic env lookup
const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  domination: process.env.STRIPE_PRICE_DOMINATION,
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { plan, userId } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({ error: "Missing plan or userId" });
    }

    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        user_id: userId,
        plan,
      },

      success_url: `${process.env.DOMAIN}/dashboard?success=1`,
      cancel_url: `${process.env.DOMAIN}/pricing`,
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Error:", err);

    return res.status(500).json({
      error: "Failed to create checkout session",
    });
  }
}