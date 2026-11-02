// backend/controllers/deliverySettingsController.js
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../config/deliveryFees.json');

// Ensure default delivery fees file exists
const getDefaultFees = () => ({
  'Bole': 150,
  'Kazanchis / Arada': 150,
  'Kirkos': 150,
  'Yeka': 180,
  'Lideta': 180,
  'Gulele': 200,
  'Nifas Silk-Lafto': 220,
  'Kolfe Keranio': 250,
  'Akaky Kaliti': 300,
  'Lemi Kura / Bole Bulbula': 220,
  'Other Central Addis Ababa Area': 200
});

// Utility helper to create config folder if missing
const ensureFolderExists = () => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

exports.getDeliveryFees = async (req, res) => {
  try {
    ensureFolderExists();
    if (!fs.existsSync(SETTINGS_FILE)) {
      const defaults = getDefaultFees();
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
      return res.status(200).json({ success: true, fees: defaults });
    }
    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return res.status(200).json({ success: true, fees: data });
  } catch (error) {
    console.error('Get Delivery Fees Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch delivery fees.' });
  }
};

exports.updateDeliveryFees = async (req, res) => {
  try {
    const { fees } = req.body; // Object mapping subcity name to numeric fee
    if (!fees || typeof fees !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid delivery fees payload.' });
    }

    ensureFolderExists();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(fees, null, 2));
    return res.status(200).json({ success: true, message: 'Delivery price list updated successfully!', fees });
  } catch (error) {
    console.error('Update Delivery Fees Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update delivery fees.' });
  }
};