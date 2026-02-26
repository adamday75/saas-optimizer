// src/api/createTrial.js
import { stripe } from '../stripe.js';

export async function createTrial(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.PRICE_BASIC_ID, // you created in Stripe
          quantity: 1,
        },
      ],
      mode: 'subscription',
      trial_period_days: 7,
      success_url: `${process.env.ROOT_URL || 'http://localhost:3000'}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.ROOT_URL || 'http://localhost:3000'}/`,
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error', err);
    res.status(500).json({ error: err.message });
  }
}
