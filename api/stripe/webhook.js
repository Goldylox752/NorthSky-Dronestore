import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 🎯 MAIN EVENT
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_email;
    const metadata = session.metadata || {};

    const lead = {
      email,
      phone: metadata.phone,
      plan: metadata.plan,
      lead_score: metadata.leadScore,
      status: "paid",
      source: "stripe_webhook",
      created_at: new Date().toISOString(),
    };

    console.log("💰 New Paid Lead:", lead);

    // 👉 HERE YOU SAVE TO DATABASE
    // example Supabase:
    //
    // await supabase.from("leads").insert([lead]);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
}