const express = require("express");
const router = express.Router();
const subCategoryController = require("../controllers/subCategory.controller");

router.get("/", subCategoryController.getSubCategories);
router.post("/", subCategoryController.addSubCategory);

module.exports = router;