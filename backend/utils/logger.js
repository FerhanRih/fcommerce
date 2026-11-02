// backend/utils/logger.js
const ActivityLog = require('../models/ActivityLog');

const logActivity = async (req, actionType, description) => {
  try {
    if (!req.user) return;
    await ActivityLog.create({
      userPhone: req.user.phone || 'N/A',
      userName: req.user.name || 'System Admin',
      role: req.user.role || 'admin',
      actionType,
      description,
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
};

module.exports = { logActivity };