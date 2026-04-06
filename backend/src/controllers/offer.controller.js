const Subscriber = require("../models/Subscriber");
const { transporter } = require("../utils/mailer");
const Offer = require("../models/Offer");

// =============================
// Helper
// =============================
const isExpired = (offer) => {
  if (!offer.validTill) return false;
  return new Date(offer.validTill).getTime() < Date.now();
};

// =============================
// Public: active offers
// =============================
exports.getActiveOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ active: true }).sort({ createdAt: -1 });
    const activeNonExpired = offers.filter((o) => !isExpired(o));
    return res.json(activeNonExpired);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// Admin: all offers
// =============================
exports.getAllOffersAdmin = async (req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    return res.json(offers);
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// Create Offer
// =============================
exports.createOffer = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const desc = req.body.desc?.trim();

    if (!title || !desc) {
      return res.status(400).json({ msg: "Title and description required" });
    }

    const offer = await Offer.create({
      title,
      desc,
      active: req.body.active !== false,
      code: req.body.code ? String(req.body.code).trim().toUpperCase() : undefined,
      discountType: req.body.discountType === "AMOUNT" ? "AMOUNT" : "PERCENT",
      discountValue: Number(req.body.discountValue || 0),
      minOrder: Number(req.body.minOrder || 0),
      validTill: req.body.validTill ? new Date(req.body.validTill) : null,
    });

    return res.status(201).json({ msg: "Offer created", offer });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// Update Offer
// =============================
exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ msg: "Offer not found" });

    Object.assign(offer, req.body);
    await offer.save();

    return res.json({ msg: "Offer updated", offer });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// Delete Offer
// =============================
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ msg: "Offer not found" });

    await offer.deleteOne();
    return res.json({ msg: "Offer deleted" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// Apply Coupon
// =============================
exports.applyOffer = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const cartTotal = Number(req.body.cartTotal || 0);

    const offer = await Offer.findOne({ code, active: true });
    if (!offer) return res.status(400).json({ msg: "Invalid coupon code" });

    if (isExpired(offer))
      return res.status(400).json({ msg: "Coupon expired" });

    if (cartTotal < (offer.minOrder || 0))
      return res.status(400).json({ msg: `Minimum order ₹${offer.minOrder} required` });

    let discount = 0;
    if (offer.discountType === "PERCENT") {
      discount = Math.round((cartTotal * offer.discountValue) / 100);
    } else {
      discount = Math.min(cartTotal, offer.discountValue);
    }

    return res.json({ ok: true, discount, offer });
  } catch (err) {
    return res.status(500).json({ msg: "Server error" });
  }
};

// =============================
// SEND OFFER EMAIL (UPDATED FOR PHONE TESTING)
// =============================
exports.sendOfferEmail = async (req, res) => {
  try {
    console.log("✅ sendOfferEmail HIT:", req.params.id);

    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ msg: "Offer not found" });

    // Safety checks
    if (!offer.active) return res.status(400).json({ msg: "Offer is inactive" });
    if (isExpired(offer)) return res.status(400).json({ msg: "Offer expired" });

    const subs = await Subscriber.find({ isActive: true }).select("email").lean();
    if (!subs.length) return res.status(400).json({ msg: "No active subscribers found" });

    //  Use env URLs (for testing use IP or ngrok/https)
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://192.168.0.101:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://192.168.0.101:5000";


    const subject = `FreshMart Update: ${offer.title} 🌿`;

    let successCount = 0;
    let failCount = 0;

    for (const s of subs) {
      const email = String(s.email || "").trim().toLowerCase();
      if (!email) continue;

      //  Unsubscribe: DIRECT backend endpoint (best for phone + email clients)
      const unsubscribeUrl =
        `${BACKEND_URL}/api/subscribers/unsubscribe?email=${encodeURIComponent(email)}`;

      //  Shop now
      const shopUrl = `${FRONTEND_URL}/`; // or `${FRONTEND_URL}/offers`

     const html = `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:#198754;padding:20px;text-align:center;color:#ffffff;">
                <h2 style="margin:0;">FreshMart 🌿</h2>
                <p style="margin:5px 0 0;font-size:14px;">Fresh Deals Just For You</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <h3 style="margin-top:0;">${offer.title}</h3>
                <p style="color:#555;margin:8px 0 0;">${offer.desc}</p>

                <div style="margin:20px 0;padding:15px;background:#e9f7ef;border-radius:10px;text-align:center;">
                  ${
                    offer.code
                      ? `<div style="font-size:13px;color:#555;">Use Code</div>
                         <div style="font-size:24px;font-weight:800;letter-spacing:2px;color:#198754;">
                           ${offer.code}
                         </div>`
                      : `<div style="font-size:18px;font-weight:800;color:#198754;">
                           Auto Applied Offer
                         </div>`
                  }
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                  <tr>
                    <td style="color:#555;font-size:14px;padding:6px 0;">
                      <b>Discount:</b>
                      ${
                        offer.discountType === "AMOUNT"
                          ? `₹${offer.discountValue} OFF`
                          : `${offer.discountValue}% OFF`
                      }
                    </td>
                  </tr>
                  ${
                    offer.minOrder && Number(offer.minOrder) > 0
                      ? `<tr>
                          <td style="color:#555;font-size:14px;padding:6px 0;">
                            <b>Min Order:</b> ₹${offer.minOrder}
                          </td>
                        </tr>`
                      : ``
                  }
                  <tr>
                    <td style="color:#555;font-size:14px;padding:6px 0;">
                      <b>Valid Till:</b>
                      ${
                        offer.validTill
                          ? new Date(offer.validTill).toLocaleDateString()
                          : "No expiry"
                      }
                    </td>
                  </tr>
                </table>

                ${
                  offer.validTill
                    ? `<div style="margin-top:12px;color:#dc3545;font-weight:800;">
                         ⏰ Hurry! Offer ends soon.
                       </div>`
                    : ``
                }

                <!-- CTA -->
                <div style="text-align:center;margin:26px 0 10px;">
                  <a href="${shopUrl}" target="_blank" rel="noopener"
                     style="background:#198754;color:#ffffff;padding:14px 28px;text-decoration:none;
                            border-radius:999px;font-weight:800;display:inline-block;">
                    Shop Now
                  </a>
                </div>

                <div style="text-align:center;color:#6b7280;font-size:12px;margin-top:6px;">
                  Thank you for shopping with FreshMart 💚
                </div>

                <hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />

                <p style="font-size:12px;color:#6b7280;text-align:center;margin:0;">
                  Don’t want these emails?
                  <a href="${unsubscribeUrl}" target="_blank" rel="noopener" style="color:#198754;">Unsubscribe</a>
                </p>

              </td>
            </tr>

          </table>

          <div style="width:600px;max-width:100%;text-align:center;color:#9aa0a6;font-size:11px;margin-top:10px;">
            © ${new Date().getFullYear()} FreshMart. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </div>
`;
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: email,
          subject,
          html,
        });
        successCount++;
      } catch (err) {
        failCount++;
        console.log("❌ Mail failed:", email, err?.message || err);
      }
    }

    return res.json({ msg: ` Sent: ${successCount}, ❌ Failed: ${failCount}` });
  } catch (e) {
    console.log("❌ sendOfferEmail error:", e);
    return res.status(500).json({ msg: e.message || "Failed to send emails" });
  }
};
