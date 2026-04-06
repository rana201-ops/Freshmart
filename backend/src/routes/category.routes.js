const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

router.get("/", categoryController.getCategories);
router.post("/", categoryController.addCategory);

module.exports = router;