const express = require('express');
const router = express.Router();
const { getDeliveryFees, updateDeliveryFees } = require('../controllers/deliverySettingsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { SystemSetting } = require('../models');

// Existing Delivery Fees Routes
router.get('/delivery-fees', getDeliveryFees);
router.put('/delivery-fees', protect, updateDeliveryFees);

// -------------------------------------------------------------
// DATABASE-BACKED PLATFORM STATUS KILL-SWITCH ENDPOINTS
// -------------------------------------------------------------

// 1. GET /api/settings/platform-status
router.get('/platform-status', async (req, res) => {
  try {
    let [setting] = await SystemSetting.findOrCreate({
      where: { key: 'storefrontOpen' },
      defaults: { value: JSON.stringify(true) }
    });
    
    const storefrontOpen = JSON.parse(setting.value);
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
router.put('/platform-status', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { storefrontOpen } = req.body;
    
    let [setting] = await SystemSetting.findOrCreate({
      where: { key: 'storefrontOpen' },
      defaults: { value: JSON.stringify(Boolean(storefrontOpen)) }
    });

    setting.value = JSON.stringify(Boolean(storefrontOpen));
    await setting.save();

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