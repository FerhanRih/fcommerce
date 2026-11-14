// backend/controllers/adminIntelligenceController.js
const { Order, Store, User, Product } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getMarketplaceIntelligence = async (req, res) => {
  try {
    let topStore = null;
    let topBuyer = null;
    let topProduct = null;

    // 1. TOP SELLER STORE (Safe aggregate + direct lookup avoids SQL GROUP BY / alias crashes)
    try {
      const topStoreAgg = await Order.findOne({
        attributes: [
          'storeId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
        ],
        where: { storeId: { [Op.ne]: null } },
        group: ['storeId'],
        order: [[sequelize.literal('orderCount'), 'DESC']],
        raw: true
      });

      if (topStoreAgg && topStoreAgg.storeId) {
        const store = await Store.findByPk(topStoreAgg.storeId);
        let owner = null;
        if (store && store.userId) {
          owner = await User.findByPk(store.userId, {
            attributes: ['id', 'name', 'phone']
          });
        }

        topStore = {
          storeName: store?.store_name || store?.name || `Store #${topStoreAgg.storeId}`,
          ownerName: owner?.name || store?.ownerName || 'Merchant',
          phone: owner?.phone || store?.phone || store?.phoneNumber || 'N/A',
          ordersFulfilled: Number(topStoreAgg.orderCount || 0)
        };
      }
    } catch (e) {
      console.error('Top Store Query Error:', e);
    }

    // 2. TOP VOLUME BUYER (Safe aggregate + direct lookup)
    try {
      const topBuyerAgg = await Order.findOne({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
        ],
        where: { userId: { [Op.ne]: null } },
        group: ['userId'],
        order: [[sequelize.literal('orderCount'), 'DESC']],
        raw: true
      });

      if (topBuyerAgg && topBuyerAgg.userId) {
        const buyer = await User.findByPk(topBuyerAgg.userId, {
          attributes: ['id', 'name', 'phone']
        });

        topBuyer = {
          name: buyer?.name || `Customer #${topBuyerAgg.userId}`,
          phone: buyer?.phone || 'N/A',
          totalOrders: Number(topBuyerAgg.orderCount || 0)
        };
      }
    } catch (e) {
      console.error('Top Buyer Query Error:', e);
    }

    // 3. TOP PRODUCT
    try {
      topProduct = await Product.findOne({
        order: [['createdAt', 'DESC']]
      });
    } catch (e) {
      console.error('Top Product Query Error:', e);
    }

    return res.status(200).json({
      success: true,
      intelligence: { topStore, topBuyer, topProduct }
    });
  } catch (error) {
    console.error('Marketplace Intelligence Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve intelligence data.' });
  }
};