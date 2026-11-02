// backend/routes/bannerRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Op } = require('sequelize');
const Banner = require('../models/Banner');
const { protect } = require('../middleware/authMiddleware');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET /api/banners — Fetch live active banners for homepage display
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.findAll({
      where: {
        isActive: true,
        status: 'active',
        expiresAt: { [Op.gt]: now } // 👈 Strictly ensures only banners with a future expiration date are shown
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
});

// GET /api/banners/my-campaigns — Fetch current user's submitted campaigns
router.get('/my-campaigns', protect, async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user campaigns', error: error.message });
  }
});

// POST /api/banners/submit — User submits new ad with artwork + payment receipt
router.post(
  '/submit',
  protect,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'receipt', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, subtitle, linkUrl, packageName, price, durationDays } = req.body;

      const imageUrl = req.files && req.files['image']
        ? `/uploads/${req.files['image'][0].filename}`
        : null;

      const paymentReceiptUrl = req.files && req.files['receipt']
        ? `/uploads/${req.files['receipt'][0].filename}`
        : null;

      if (!imageUrl || !paymentReceiptUrl) {
        return res.status(400).json({
          success: false,
          message: 'Both banner artwork image and payment receipt screenshot are required.'
        });
      }

      const newBanner = await Banner.create({
        title: title || '',
        subtitle: subtitle || '',
        linkUrl: linkUrl || '#',
        imageUrl,
        paymentReceiptUrl,
        userId: req.user.id,
        storeId: req.user.storeId || null,
        packageName: packageName || 'Standard Campaign',
        price: price ? Number(price) : 0,
        durationDays: Number(durationDays || 7),
        status: 'pending',
        isActive: false
      });

      res.status(201).json({ success: true, banner: newBanner });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error submitting ad campaign', error: error.message });
    }
  }
);

module.exports = router;