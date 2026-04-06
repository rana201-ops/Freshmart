const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/productMaster.controller");

// vendor/admin list (category wise)
router.get("/", ctrl.getMasters);

// admin add/delete
router.post("/", protect, isAdmin, ctrl.createMaster);
router.delete("/:id", protect, isAdmin, ctrl.deleteMaster);

module.exports = router;
