const router = require("express").Router();
const { subscribe, unsubscribe } = require("../controllers/subscriber.controller");

// ✅ subscribe
router.post("/subscribe", subscribe);

// ✅ unsubscribe (email link click)
router.get("/unsubscribe", unsubscribe);

module.exports = router;

