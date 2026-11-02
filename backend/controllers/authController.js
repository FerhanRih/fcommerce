// controllers/authController.js
const { User, Store } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'fcommerce_secure_secret_key_2026';

// 1. Check if Phone Number exists
const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const formattedPhone = String(phone).trim();
    const existingUser = await User.findOne({ where: { phone: formattedPhone } });

    return res.status(200).json({
      success: true,
      message: 'Phone check completed.',
      isExistingUser: Boolean(existingUser),
    });
  } catch (error) {
    console.error('Check Phone Error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking phone number.' });
  }
};

// 2. Register New User
const register = async (req, res) => {
  try {
    const { phone, name, password } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone, full name, and password are required.' 
      });
    }

    const formattedPhone = String(phone).trim();
    const formattedName = String(name).trim();

    // Check duplicate phone
    const existingUser = await User.findOne({ where: { phone: formattedPhone } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this phone number already exists.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await User.create({
      phone: formattedPhone,
      name: formattedName,
      password: hashedPassword,
      role: 'buyer',
      is_verified: true,
    });

    // Re-fetch user including Store association
    const user = await User.findByPk(newUser.id, {
      include: [{ model: Store, as: 'store', required: false }]
    });

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        address: user.address,
      },
      store: user.store || null,
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined 
    });
  }
};

// 3. Login Existing User
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and password are required.' 
      });
    }

    const formattedPhone = String(phone).trim();

    // Find User with Store model included
    const user = await User.findOne({
      where: { phone: formattedPhone },
      include: [{ model: Store, as: 'store', required: false }]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone number or password.' 
      });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone number or password.' 
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        address: user.address,
      },
      store: user.store || null,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during login.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined 
    });
  }
};

// 4. Update User Profile & Preferences (Universal Settings)
const updateProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { name, phone, currentPassword, newPassword, preferences } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    // Handle Password Update if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferences !== undefined) user.preferences = preferences;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating profile.' });
  }
};

// Add this to your authController.js if not already present:
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

module.exports = {
  checkPhone,
  register,
  login,
  updateProfile,
  updatePassword,
};