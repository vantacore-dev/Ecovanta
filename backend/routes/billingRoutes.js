const express = require("express");
const Stripe = require("stripe");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE
};

router.post("/create-checkout-session", auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PRICE_MAP[plan]) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.companyName || user.email,
        metadata: {
          userId: String(user._id)
        }
      });

      stripeCustomerId = customer.id;
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: PRICE_MAP[plan],
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL}?checkout=cancelled`,
      metadata: {
        userId: String(user._id),
        plan
      }
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details: error.message
    });
  }
});

module.exports = router;