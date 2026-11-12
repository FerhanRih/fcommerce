// backend/routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const Store = require('../models/Store');
const { updateStoreProfile } = require('../controllers/storeController');

// POST /api/stores - Create a new store
router.post('/', protect, storeController.createStore);

// GET /api/stores/my-store - Fetch current authenticated user's store
router.get('/my-store', protect, storeController.getMyStore);

router.put('/profile', updateStoreProfile);

// PUT /api/stores/:id/profile-image - Update store profile logo/image directly via Cloudinary
router.put('/:id/profile-image', protect, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // ☁️ req.file.path holds the permanent Cloudinary HTTPS URL automatically!
    const imageUrl = req.file.path;

    store.logoUrl = imageUrl;
    await store.save();

    return res.status(200).json({
      success: true,
      message: 'Store profile image updated successfully.',
      imageUrl,
    });
  } catch (error) {
    console.error('Update Profile Image Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile image.' });
  }
});

// PUT /api/stores/:id - Update store profile & bank accounts
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { bankAccounts, storeName, phone, address } = req.body;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    let updatedAccounts = bankAccounts;
    if (typeof updatedAccounts === 'string') {
      try { updatedAccounts = JSON.parse(updatedAccounts); } catch (e) { updatedAccounts = []; }
    }

    await store.update({
      bankAccounts: Array.isArray(updatedAccounts) ? updatedAccounts : [],
      ...(storeName && { storeName }),
      ...(phone && { phone }),
      ...(address && { address }),
    });

    const freshStore = await Store.findByPk(id);

    return res.status(200).json({
      success: true,
      message: 'Store updated successfully.',
      store: freshStore,
    });
  } catch (error) {
    console.error('Update Store Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating store.' });
  }
});

module.exports = router;