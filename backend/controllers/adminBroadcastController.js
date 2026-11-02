// backend/controllers/adminBroadcastController.js
const { BroadcastMessage } = require('../models');

const adminBroadcastController = {
  // Send broadcast message
  sendBroadcast: async (req, res) => {
    try {
      const { message, target } = req.body;
      if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'Broadcast message content is required.' });
      }

      const broadcast = await BroadcastMessage.create({
        message,
        target: target || 'both',
        senderName: req.user?.name || 'Super Admin'
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Broadcast notification dispatched successfully!', 
        broadcast 
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      return res.status(500).json({ success: false, message: 'Failed to send broadcast.' });
    }
  },

  // Fetch recent broadcasts for clients (users/vendors)
  getClientBroadcasts: async (req, res) => {
    try {
      const broadcasts = await BroadcastMessage.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      return res.status(200).json({ success: true, broadcasts });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch broadcasts.' });
    }
  }
};

module.exports = adminBroadcastController;