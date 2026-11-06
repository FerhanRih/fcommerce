// backend/controllers/adminController.js
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { SystemSetting } = require('../models');

const adminController = {
  
  getDashboardStats: async (req, res) => {
    try {
      const Order = sequelize.models.Order;
      const Store = sequelize.models.Store;
      const User = sequelize.models.User;
      const Banner = sequelize.models.Banner;

      const totalUsers = User ? await User.count() : 0;
      
      const staffCount = User ? await User.count({
        where: { role: { [Op.in]: ['admin', 'superadmin', 'staff', 'delivery'] } }
      }) : 0;

      const totalCustomers = User ? await User.count({
        where: { role: { [Op.notIn]: ['admin', 'superadmin', 'staff', 'delivery'] } }
      }) : 0;

      const totalStores = Store ? await Store.count() : 0;
      let pendingStores = 0;
      let activeStores = 0;

      try {
        if (Store) {
          pendingStores = await Store.count({ 
            where: { status: 'pending' } 
          });
          activeStores = Math.max(0, totalStores - pendingStores);
        }
      } catch (e) {
        pendingStores = 0;
        activeStores = totalStores;
      }

      let adBannerRequests = 0;
      let runningAds = 0;
      try {
        if (Banner) {
          adBannerRequests = await Banner.count({ where: { status: 'pending' } });
          // Check for both 'active' and 'approved' banner statuses to be safe
          runningAds = await Banner.count({ where: { status: { [Op.in]: ['active', 'approved'] } } });
        }
      } catch (e) {}

      const totalOrders = Order ? await Order.count() : 0;
      const pendingRequests = Order ? await Order.count({ where: { status: { [Op.in]: ['pending_merchant', 'pending'] } } }) : 0;
      const waitingPayment = Order ? await Order.count({ where: { status: 'accepted' } }) : 0;
      
      // ✅ FIXED: Count orders where receipt is uploaded and waiting for super admin/merchant verification
      const waitingVerification = Order ? await Order.count({ where: { status: { [Op.in]: ['payment_uploaded', 'paid'] } } }) : 0;
      
      // ✅ FIXED: Include 'payment_verified', 'verified', and 'dispatched' in transit/ready counts
      const inTransit = Order ? await Order.count({ where: { status: { [Op.in]: ['payment_verified', 'verified', 'dispatched'] } } }) : 0;
      
      const deliveredOrders = Order ? await Order.count({ where: { status: 'delivered' } }) : 0;
      const cancelledOrders = Order ? await Order.count({ 
        where: { status: { [Op.in]: ['cancelled', 'Cancelled', 'rejected', 'Rejected', 'expired'] } } 
      }) : 0;

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          staffCount,
          totalCustomers,
          totalStores,
          activeStores,
          pendingStores,
          adBannerRequests,
          runningAds,
          totalOrders,
          pendingRequests,
          waitingPayment,
          waitingVerification, // 👈 Now correctly counts 'payment_uploaded'
          inTransit,
          deliveredOrders,
          cancelledOrders,
        }
      });
    } catch (error) {
      console.error('Dashboard Stats Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
    }
  },

  // 2. Master All Orders Audit (Safely Including Order Items & Products)
  getAllOrders: async (req, res) => {
    try {
      const Order = sequelize.models.Order;
      const Store = sequelize.models.Store;
      const User = sequelize.models.User;
      const OrderItem = sequelize.models.OrderItem;
      const Product = sequelize.models.Product;

      if (!Order) {
        return res.status(500).json({ success: false, message: 'Order model not initialized.' });
      }

      const { phone, search, date } = req.query;
      const orderWhere = {};
      const storeWhere = {};
      const userWhere = {};

      if (date) {
        orderWhere.createdAt = {
          [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`]
        };
      }

      if (phone) {
        orderWhere[Op.or] = [
          { customerPhone: { [Op.like]: `%${phone}%` } }
        ];
        userWhere.phone = { [Op.like]: `%${phone}%` };
      }

      if (search) {
        storeWhere[Op.or] = [
          { store_name: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } }
        ];
        userWhere[Op.or] = [
          ...(userWhere[Op.or] || []),
          { name: { [Op.like]: `%${search}%` } }
        ];
      }

      const includeArray = [];
      if (Store) {
        includeArray.push({
          model: Store,
          as: 'Store',
          required: false,
          include: User ? [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'], required: false }] : []
        });
      }
      if (User) {
        includeArray.push({
          model: User,
          as: 'User',
          required: false,
          attributes: ['id', 'name', 'phone']
        });
      }
      if (OrderItem) {
        includeArray.push({
          model: OrderItem,
          as: 'OrderItems',
          required: false,
          include: Product ? [{ model: Product, as: 'Product', attributes: ['id', 'title', 'price', 'category'], required: false }] : []
        });
      }

      const orders = await Order.findAll({
        where: orderWhere,
        include: includeArray,
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error('Get All Orders Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve all orders.' });
    }
  },

  // 3. Marketplace Intelligence Leaderboard
  getMarketplaceIntelligence: async (req, res) => {
    try {
      const Order = sequelize.models.Order;
      const Store = sequelize.models.Store;
      const User = sequelize.models.User;
      const Product = sequelize.models.Product;

      let topStore = null;
      let topBuyer = null;
      let topProduct = null;

      try {
        if (Order && Store) {
          const topStoreRecord = await Order.findOne({
            attributes: ['storeId', [sequelize.fn('COUNT', sequelize.col('storeId')), 'orderCount']],
            where: { storeId: { [Op.ne]: null } },
            group: ['storeId'],
            order: [[sequelize.literal('orderCount'), 'DESC']],
            include: [{ 
              model: Store, 
              as: 'Store',
              include: User ? [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'], required: false }] : []
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
        }
      } catch (e) {
        console.error('Top Store Query Error:', e);
      }

      try {
        if (Order && User) {
          const topBuyerRecord = await Order.findOne({
            attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('userId')), 'orderCount']],
            where: { userId: { [Op.ne]: null } },
            group: ['userId'],
            order: [[sequelize.literal('orderCount'), 'DESC']],
            include: [{ model: User, as: 'User', attributes: ['id', 'name', 'phone'], required: false }],
            limit: 1
          });

          if (topBuyerRecord) {
            topBuyer = {
              name: topBuyerRecord.User?.name || 'Customer',
              phone: topBuyerRecord.User?.phone || 'N/A',
              totalOrders: topBuyerRecord.getDataValue('orderCount')
            };
          }
        }
      } catch (e) {
        console.error('Top Buyer Query Error:', e);
      }

      try {
        if (Product) {
          topProduct = await Product.findOne({
            order: [['createdAt', 'DESC']]
          });
        }
      } catch (e) {}

      return res.status(200).json({
        success: true,
        intelligence: { topStore, topBuyer, topProduct }
      });
    } catch (error) {
      console.error('Marketplace Intelligence Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve intelligence data.' });
    }
  },

  // 4. Lifecycle Orders Hub (Handles ?stage=requests | decision | paid | verified)
  getLifecycleOrders: async (req, res) => {
    try {
      const Order = sequelize.models.Order;
      const Store = sequelize.models.Store;
      const User = sequelize.models.User;
      const OrderItem = sequelize.models.OrderItem;
      const Product = sequelize.models.Product;

      if (!Order) {
        return res.status(500).json({ success: false, message: 'Order model not initialized.' });
      }

      const { stage } = req.query;
      let statusCondition = {};

      // Map frontend lifecycle stages to database order statuses
      if (stage === 'requests') {
        statusCondition = { status: { [Op.in]: ['pending_merchant', 'pending'] } };
      } else if (stage === 'decision') {
        statusCondition = { status: { [Op.in]: ['accepted', 'rejected'] } };
      } else if (stage === 'paid') {
        // 👈 Added 'payment_uploaded' to match customer receipt uploads
        statusCondition = { status: { [Op.in]: ['paid', 'payment_submitted', 'payment_uploaded'] } };
      } else if (stage === 'verified') {
        // 👈 Removed 'delivered' so it only shows active verified/dispatched orders
        statusCondition = { status: { [Op.in]: ['verified', 'payment_verified', 'dispatched'] } };
      } else {
        statusCondition = {}; // Fallback fetch all if stage is unrecognized
      }

      const includeArray = [];
      if (Store) {
        includeArray.push({
          model: Store,
          as: 'Store',
          required: false,
          include: User ? [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'], required: false }] : []
        });
      }
      if (User) {
        includeArray.push({
          model: User,
          as: 'User',
          required: false,
          attributes: ['id', 'name', 'phone']
        });
      }
      if (OrderItem) {
        includeArray.push({
          model: OrderItem,
          as: 'OrderItems',
          required: false,
          include: Product ? [{ model: Product, as: 'Product', attributes: ['id', 'title', 'price', 'category'], required: false }] : []
        });
      }

      const orders = await Order.findAll({
        where: statusCondition,
        include: includeArray,
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      return res.status(200).json({ success: true, orders });
    } catch (error) {
      console.error('Lifecycle Orders Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve lifecycle orders.' });
    }
  },

// Get storefront/platform status
getPlatformStatus: async (req, res) => {
  try {
    let [setting] = await SystemSetting.findOrCreate({
      where: { key: 'storefrontOpen' },
      defaults: { value: JSON.stringify(true) }
    });
    
    const isOpen = JSON.parse(setting.value);
    return res.status(200).json({ success: true, storefrontOpen: isOpen });
  } catch (error) {
    console.error('Get Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
},

// Update storefront/platform status
updatePlatformStatus: async (req, res) => {
  try {
    const { storefrontOpen } = req.body;
    
    let [setting] = await SystemSetting.findOrCreate({
      where: { key: 'storefrontOpen' },
      defaults: { value: JSON.stringify(storefrontOpen) }
    });

    setting.value = JSON.stringify(storefrontOpen);
    await setting.save();

    return res.status(200).json({ 
      success: true, 
      message: `Platform successfully ${storefrontOpen ? 'OPENED' : 'PAUSED'}!`,
      storefrontOpen 
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
}


};

module.exports = adminController;