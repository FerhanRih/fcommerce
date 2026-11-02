// backend/routes/deliverySettingsRoutes.js (or backend/routes/settingsRoutes.js)
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getDeliveryFees, updateDeliveryFees } = require('../controllers/deliverySettingsController');
const { protect } = require('../middleware/authMiddleware');

// Path to store settings JSON safely in backend/data/
const settingsFilePath = path.join(__dirname, '../data/platformSettings.json');

// Helper function to read platform status safely without crashing
const readPlatformStatus = () => {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const rawData = fs.readFileSync(settingsFilePath, 'utf8');
      const parsed = JSON.parse(rawData);
      return parsed.storefrontOpen !== false;
    }
  } catch (err) {
    console.error('Error reading platformSettings.json:', err.message);
  }
  return true; // Default open
};

// Existing Delivery Fees Routes
router.get('/delivery-fees', getDeliveryFees);
router.put('/delivery-fees', protect, updateDeliveryFees);

// -------------------------------------------------------------
// NEW: Platform Status Kill-Switch Endpoints
// -------------------------------------------------------------

// 1. GET /api/settings/platform-status
router.get('/platform-status', (req, res) => {
  try {
    const storefrontOpen = readPlatformStatus();
    return res.status(200).json({
      success: true,
      storefrontOpen
    });
  } catch (err) {
    console.error('GET platform-status error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve platform status.'
    });
  }
});

// 2. PUT /api/settings/platform-status (Super Admin Toggle)
router.put('/platform-status', protect, (req, res) => {
  try {
    const { storefrontOpen } = req.body;
    
    // Auto-create data directory if missing
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const payload = { storefrontOpen: Boolean(storefrontOpen) };
    fs.writeFileSync(settingsFilePath, JSON.stringify(payload, null, 2), 'utf8');

    return res.status(200).json({
      success: true,
      message: `Storefront is now ${storefrontOpen ? 'OPEN (Accepting Orders)' : 'CLOSED (Maintenance Mode)'}`,
      storefrontOpen: Boolean(storefrontOpen)
    });
  } catch (err) {
    console.error('PUT platform-status error:', err);
    return res.status(500).json({
      success: false,
      message: `Server Error updating status: ${err.message}`
    });
  }
});

module.exports = router;