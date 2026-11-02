// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Store = require('../models/Store'); // 👈 Make sure Store model is imported
const upload = require('../middleware/uploadMiddleware'); 
const { protect } = require('../middleware/authMiddleware');

// Get all products (with optional ?storeId= filter)
router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    const filter = storeId ? { storeId } : {};

    const products = await Product.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      products: products || [],
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching products',
    });
  }
});

// Create new product (Protected & Strictly Guarded by Authenticated User's Store Approval)
router.post('/', protect, upload ? upload.single('image') : (req, res, next) => next(), async (req, res) => {
  try {
    const { title, category, price, stock, storeName, description, minOrderQty } = req.body;
    const userId = req.user.id || req.user.userId;

    // 🛡️ SECURITY GUARD: Find the store belonging to the logged-in user
    const store = await Store.findOne({
      where: {
        [Store.sequelize.Sequelize.Op.or]: [{ userId }, { user_id: userId }]
      }
    });

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: 'No store found for this account. Please register a store first.' 
      });
    }

    // 🛡️ CHECK APPROVAL STATUS
    if (store.status !== 'approved' && !store.is_approved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your store is currently pending Super Admin approval. You cannot list products yet.' 
      });
    }

    // Handle uploaded file path if multer is active
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;

    const newProduct = await Product.create({
      title,
      category: category || 'Perfume',
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : 0,
      storeId: store.id, // Enforce the actual approved store ID
      storeName: store.store_name || store.name || storeName || 'Boutique Store',
      imageUrl,
      description,
      minOrderQty: minOrderQty !== undefined ? Number(minOrderQty) : 1,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
});

// Update product (supports image upload and MOQ updates)
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, price, stock, description, minOrderQty } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : product.imageUrl;

    await product.update({
      title: title || product.title,
      category: category || product.category,
      price: price !== undefined ? price : product.price,
      stock: stock !== undefined ? stock : product.stock,
      description: description !== undefined ? description : product.description,
      minOrderQty: minOrderQty !== undefined ? Number(minOrderQty) : product.minOrderQty,
      imageUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating product.' });
  }
});

// Delete product
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting product.' });
  }
});

module.exports = router;