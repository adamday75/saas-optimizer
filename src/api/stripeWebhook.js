// src/api/stripeWebhook.js
import { stripe } from '../stripe.js';
// Optional: if you want to persist the subscription data
// import { db } from '../db.js';

export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Checkout session completed:', session.id);
    // Example: save to DB
    // await db.save({
    //   stripeCustomerId: session.customer,
    //   stripeSubscriptionId: session.subscription,
    //   email: session.customer_details.email
    // });
  }

  // Handle other events you care about, if any

  res.json({ received: true });
}
