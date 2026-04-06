const router = require("express").Router();
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-subscription", async (req, res) => {
  const { email } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "FreshMart Subscription",
          },
          unit_amount: 4900,
        },
        quantity: 1,
      },
    ],
   success_url: `${process.env.FRONTEND_URL}/?success=true&email=${email}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });

  res.json({ url: session.url });
});

module.exports = router;