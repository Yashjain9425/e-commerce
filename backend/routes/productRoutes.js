const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

const multer = require("multer");

const upload = multer({
  dest: "uploads/",
});

const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(
    protect,
    admin,
    upload.array("images", 5),
    createProduct
  );

router
  .route("/:id")
  .get(getProductById)
  .put(
    protect,
    admin,
    upload.array("images", 5),
    updateProduct
  )
  .delete(
    protect,
    admin,
    deleteProduct
  );

module.exports = router;