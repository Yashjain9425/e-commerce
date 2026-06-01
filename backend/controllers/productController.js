const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path)
      );

      const results = await Promise.all(uploadPromises);

      imageUrls = results.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
      }));
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: imageUrls,
    });

    const createdProduct = await product.save();

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.stock = stock || product.stock;

      if (req.files && req.files.length > 0) {
        // Delete old images from Cloudinary before replacing them
        if (product.images && product.images.length > 0) {
          const deletePromises = product.images.map((image) => {
            // Support migration: check if image has public_id (new format)
            if (image.public_id) {
              return cloudinary.uploader.destroy(image.public_id);
            }
            return Promise.resolve();
          });

          await Promise.all(deletePromises);
        }

        // Upload new images
        const uploadPromises = req.files.map((file) =>
          cloudinary.uploader.upload(file.path)
        );

        const results = await Promise.all(uploadPromises);

        const imageUrls = results.map((result) => ({
          url: result.secure_url,
          public_id: result.public_id,
        }));

        product.images = imageUrls;
      }

      const updatedProduct = await product.save();

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Delete all Cloudinary images before deleting the product
      if (product.images && product.images.length > 0) {
        const deletePromises = product.images.map((image) => {
          // Support migration: check if image has public_id (new format)
          if (image.public_id) {
            return cloudinary.uploader.destroy(image.public_id);
          }
          return Promise.resolve();
        });

        await Promise.all(deletePromises);
      }

      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};