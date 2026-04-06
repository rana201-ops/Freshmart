const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const offerCtrl = require("../controllers/offer.controller");

// public
router.get("/", offerCtrl.getActiveOffers);

// ✅ NEW: apply coupon (public)
router.post("/apply", offerCtrl.applyOffer);

// admin
router.get("/all", protect, isAdmin, offerCtrl.getAllOffersAdmin);
router.post("/", protect, isAdmin, offerCtrl.createOffer);
router.patch("/:id", protect, isAdmin, offerCtrl.updateOffer);
router.delete("/:id", protect, isAdmin, offerCtrl.deleteOffer);

//   send offer email to subscribers
router.post("/:id/send-email", protect, isAdmin, offerCtrl.sendOfferEmail);


module.exports = router;
