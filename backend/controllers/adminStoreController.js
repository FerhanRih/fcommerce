// backend/controllers/adminStoreController.js
const { Store, User } = require('../models');
const { Op } = require('sequelize');

const adminStoreController = {
  // Fetch Stores based on status ('pending' / 'approved') and search query
  getAdminStores: async (req, res) => {
    try {
      const { tab = 'pending', search } = req.query; // tab: 'pending' | 'approved'
      
      let whereClause = {};
      if (tab === 'pending') {
        whereClause.status = { [Op.in]: ['pending', 'under_review', null, ''] }; 
      } else {
        whereClause.status = 'approved';
      }

      const stores = await Store.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      // Resolve owner details via userId for every store
      const formattedStores = await Promise.all(
        stores.map(async (store) => {
          let storeData = store.toJSON();

          if (storeData.userId && User) {
            const user = await User.findByPk(storeData.userId, {
              attributes: ['id', 'name', 'phone']
            });
            if (user) {
              storeData.ownerName = user.name;
              storeData.phone = user.phone;
              storeData.email = user.email || 'N/A';
            }
          }

          return storeData;
        })
      );

      // Apply search filter if provided
      let filtered = formattedStores;
      if (search && search.trim() !== '') {
        const query = search.toLowerCase();
        filtered = formattedStores.filter(s => 
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(query)) ||
          (s.phone && s.phone.includes(query))
        );
      }

      return res.status(200).json({ success: true, stores: filtered });
    } catch (error) {
      console.error('Fetch Admin Stores Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch stores.' });
    }
  },

  // Update Store Status (Approve / Reject)
  updateStoreStatus: async (req, res) => {
    try {
      const { storeId } = req.params;
      const { status, rejectionReason } = req.body; // status: 'approved' | 'rejected'

      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found.' });
      }

      store.status = status;
      if (status === 'rejected' && rejectionReason) {
        store.rejectionReason = rejectionReason;
      }
      await store.save();

      // Fetch owner phone for SMS generation response
      let ownerPhone = null;
      if (store.userId && User) {
        const user = await User.findByPk(store.userId, { attributes: ['phone'] });
        if (user) ownerPhone = user.phone;
      }

      return res.status(200).json({
        success: true,
        message: `Store #${storeId} has been ${status}.`,
        store,
        ownerPhone
      });
    } catch (error) {
      console.error('Update Store Status Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update store status.' });
    }
  },

  // Delete Store and Demote User back to regular 'user' role
  deleteStore: async (req, res) => {
    try {
      const { storeId } = req.params;
      const store = await Store.findByPk(storeId);
      
      if (!store) {
        return res.status(404).json({ success: false, message: 'Store not found.' });
      }

      const userId = store.userId;

      // Delete associated products
      if (global.sequelize && global.sequelize.models.Product) {
        await global.sequelize.models.Product.destroy({ where: { storeId: store.id } });
      }

      // Destroy store record
      await store.destroy();

      // Demote owner back to regular customer role
      if (userId && User) {
        const user = await User.findByPk(userId);
        if (user) {
          await user.update({ role: 'user' });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Store permanently revoked/deleted and owner demoted to regular user.',
      });
    } catch (error) {
      console.error('Delete Store & Demote Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete store.' });
    }
  }
};

// Aliases mapped directly onto the object so both route names work smoothly
adminStoreController.getStoreApprovals = adminStoreController.getAdminStores;
adminStoreController.updateStoreApproval = adminStoreController.updateStoreStatus;

module.exports = adminStoreController;