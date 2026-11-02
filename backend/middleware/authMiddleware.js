// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

const JWT_SECRET = process.env.JWT_SECRET || 'fcommerce_secure_secret_key_2026';

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Handle 'undefined' or 'null' string passed from frontend
  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support both decoded.id and decoded.userId
    const userId = decoded.id || decoded.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. User account not found.',
      });
    }

    req.user = user; // Attach full user model to req
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user?.role}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};