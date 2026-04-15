const express = require("express");
const Stripe = require("stripe");
const User = require("../models/User");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;

          if (session.mode === "subscription") {
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan;

            if (userId) {
              await User.findByIdAndUpdate(userId, {
                plan: plan || "pro",
                stripeCustomerId: session.customer || "",
                stripeSubscriptionId: session.subscription || "",
                subscriptionStatus: "active"
              });
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;

          await User.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              subscriptionStatus: subscription.status
            }
          );
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;

          await User.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
              plan: "free",
              subscriptionStatus: subscription.status
            }
          );
          break;
        }

        default:
          break;
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

module.exports = router;