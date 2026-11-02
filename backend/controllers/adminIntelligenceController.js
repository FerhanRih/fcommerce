// backend/controllers/adminIntelligenceController.js
const { Order, Store, User, Product } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

exports.getMarketplaceIntelligence = async (req, res) => {
  try {
    let topStore = null;
    let topBuyer = null;
    let topProduct = null;

    try {
      const topStoreRecord = await Order.findOne({
        attributes: ['storeId', [sequelize.fn('COUNT', sequelize.col('storeId')), 'orderCount']],
        where: { storeId: { [Op.ne]: null } },
        group: ['storeId'],
        order: [[sequelize.literal('orderCount'), 'DESC']],
        include: [{ 
          model: Store, 
          as: 'Store',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }]
        }],
        limit: 1
      });

      if (topStoreRecord) {
        topStore = {
          storeName: topStoreRecord.Store?.store_name || topStoreRecord.Store?.name || 'Store',
          ownerName: topStoreRecord.Store?.user?.name || 'Merchant',
          phone: topStoreRecord.Store?.user?.phone || topStoreRecord.Store?.phone || 'N/A',
          ordersFulfilled: topStoreRecord.getDataValue('orderCount')
        };
      }
    } catch (e) {
      console.error('Top Store Query Error:', e);
    }

    try {
      const topBuyerRecord = await Order.findOne({
        attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('userId')), 'orderCount']],
        where: { userId: { [Op.ne]: null } },
        group: ['userId'],
        order: [[sequelize.literal('orderCount'), 'DESC']],
        include: [{ model: User, as: 'User', attributes: ['id', 'name', 'phone'] }],
        limit: 1
      });

      if (topBuyerRecord) {
        topBuyer = {
          name: topBuyerRecord.User?.name || 'Customer',
          phone: topBuyerRecord.User?.phone || 'N/A',
          totalOrders: topBuyerRecord.getDataValue('orderCount')
        };
      }
    } catch (e) {
      console.error('Top Buyer Query Error:', e);
    }

    try {
      topProduct = await Product.findOne({
        order: [['createdAt', 'DESC']]
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      intelligence: { topStore, topBuyer, topProduct }
    });
  } catch (error) {
    console.error('Marketplace Intelligence Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve intelligence data.' });
  }
};