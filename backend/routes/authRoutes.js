// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  checkPhone, 
  register, 
  login, 
  updateProfile, 
  updatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-phone', checkPhone);
router.post('/register', register);
router.post('/login', login);

router.put('/profile', protect, updateProfile); // 👈 Preserved for your user side page
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;