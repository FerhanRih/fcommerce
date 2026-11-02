// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const Order = require('./models/Order');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
// 1. Initialize Express app FIRST
const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Check every 1 minute for expired pending orders
setInterval(async () => {
  try {
    await Order.update(
      { status: 'expired' },
      {
        where: {
          status: 'pending_merchant',
          expiresAt: { [Op.lt]: new Date() },
        },
      }
    );
  } catch (err) {
    console.error('Error auto-expiring orders:', err);
  }
}, 60 * 1000);

// Import centralized models & DB connection (runs associations in models/index.js)
const { sequelize } = require('./models');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const storeRoutes = require('./routes/storeRoutes');
const productRoutes = require('./routes/productRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/orders', orderRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/settings', settingsRoutes);
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.put('/api/users/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    // 👇 Matches your login secret key exactly!
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fcommerce_secure_secret_key_2026');
    const userId = decoded.id;

    const { name, phone, currentPassword, newPassword, preferences } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    // Handle Password Change if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferences !== undefined) user.preferences = preferences;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
});


// --- REVIEWS API ROUTES ---
app.get('/api/reviews/product/:productId', (req, res) => {
  try {
    res.json({ success: true, reviews: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { productId, rating, comment, user } = req.body;
    const newReview = {
      id: Date.now(),
      productId,
      rating,
      comment,
      user: user || 'Verified Buyer',
      date: 'Just now'
    };
    res.json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health Check
app.get('/', (req, res) => {
  res.send('FCOMMERCE API is running for fcommerce_db2...');
});

const PORT = process.env.PORT || 5000;

const syncOptions = { alter: true };
sequelize
  .sync(syncOptions)
  .then(() => {
    console.log('✅ Database connected & models synced.');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });