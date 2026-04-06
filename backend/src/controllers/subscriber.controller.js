const Subscriber = require("../models/Subscriber");


const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }

    const normalized = email.toLowerCase().trim();

    const existing = await Subscriber.findOne({ email: normalized });

   if (existing && existing.isActive) {
  existing.amountPaid = 49;
  existing.paymentStatus = "paid";
  await existing.save();

  return res.status(200).json({ message: "Already subscribed ✅" });
}

    if (existing && !existing.isActive) {
  existing.isActive = true;
  existing.amountPaid = 49;
  existing.paymentStatus = "paid";
  await existing.save();
  return res.status(200).json({ message: "Subscribed again ✅" });
}
await Subscriber.create({
  email: normalized,
  amountPaid: 49,
  paymentStatus: "paid",
});

    return res.status(201).json({ message: "Subscribed successfully 🎉" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ message: "Already subscribed ✅" });
    }
    return res.status(500).json({ message: "Server error. Try again." });
  }
};
exports.unsubscribe = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).send("Invalid email");
    }

    const sub = await Subscriber.findOne({ email });

    if (!sub) {
      return res.status(404).send("Subscriber not found");
    }

    sub.isActive = false;
    await sub.save();

    return res.send(`
      <div style="font-family:Arial;padding:40px;text-align:center">
        <h2>✅ Unsubscribed</h2>
        <p><b>${email}</b> will no longer receive FreshMart emails.</p>
      </div>
    `);
  } catch (e) {
    console.log("unsubscribe error:", e);
    return res.status(500).send("Server error");
  }
};

