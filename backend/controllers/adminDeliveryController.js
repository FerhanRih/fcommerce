// backend/controllers/adminDeliveryController.js
const { Order, Store, User } = require('../models');
const { Op } = require('sequelize');

const adminDeliveryController = {
  // 1. Fetch Active Delivery Orders ONLY (Strictly excludes 'delivered')
  getDeliveryOrders: async (req, res) => {
    try {
      const { deliveryStatus } = req.query; // 'all' | 'verified' | 'dispatched'
      
      // Active transit statuses strictly excluding fulfilled/cancelled orders
      const pickupStatuses = ['payment_verified', 'verified', 'payment_approved', 'paid'];
      const transitStatuses = ['dispatched'];

      let targetStatuses = [];

      if (deliveryStatus === 'verified') {
        targetStatuses = pickupStatuses;
      } else if (deliveryStatus === 'dispatched') {
        targetStatuses = transitStatuses;
      } else {
        // 'all' active tab: Pickup Ready + In Transit
        targetStatuses = [...pickupStatuses, ...transitStatuses];
      }

      const orders = await Order.findAll({
        where: {
          status: { [Op.in]: targetStatuses }
        },
        order: [['updatedAt', 'DESC']]
      });

      const formattedOrders = await Promise.all(
        orders.map(async (order) => {
          let storeData = null;
          let userData = null;

          // 1. Merchant & Store Phone Lookup
          if (order.storeId && Store) {
            try {
              const store = await Store.findByPk(order.storeId);
              if (store) {
                storeData = store.toJSON();

                // Fetch creator user to get merchant phone number
                if (store.userId && User) {
                  const merchantUser = await User.findByPk(store.userId, { 
                    attributes: ['id', 'name', 'phone'] 
                  });
                  if (merchantUser) {
                    storeData.phone = merchantUser.phone;
                    storeData.phoneNumber = merchantUser.phone;
                    storeData.ownerName = merchantUser.name;
                  }
                }
              }
            } catch (err) {
              console.error(`Error resolving store #${order.storeId}:`, err);
            }
          }

          // 2. Customer User Lookup
          if (order.userId && User) {
            try {
              const user = await User.findByPk(order.userId, { 
                attributes: ['id', 'name', 'phone'] 
              });
              if (user) {
                userData = user.toJSON();
              }
            } catch (err) {
              console.error(`Error resolving user #${order.userId}:`, err);
            }
          }

          return {
            ...order.toJSON(),
            Store: storeData,
            User: userData,
            items: order.items || [] 
          };
        })
      );

      return res.status(200).json({ success: true, orders: formattedOrders });
    } catch (error) {
      console.error('Fetch Delivery Orders Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve delivery orders.' });
    }
  },

  // 2. Update Delivery Status with 4-Digit PIN Verification
  updateDeliveryStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, pin } = req.body; 

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (status === 'delivered') {
        if (!pin || pin.toString().trim() !== order.deliveryPin?.toString().trim()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid 4-digit delivery PIN! Please verify with the buyer.' 
          });
        }
      }

      if (status === 'dispatched' && !order.deliveryPin) {
        order.deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
      }

      order.status = status;
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Delivery order #${orderId} updated to ${status}.`,
        order
      });
    } catch (error) {
      console.error('Update Delivery Status Error:', error);
      return res.status(500).json({ success: false, message: 'Server error updating delivery status.' });
    }
  }
};

module.exports = adminDeliveryController;