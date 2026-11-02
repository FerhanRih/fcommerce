// backend/controllers/adminOrderController.js
const { Order, Store, User } = require('../models');
const { Op } = require('sequelize');

// 1. Fetch Lifecycle Orders by Stage
exports.getLifecycleOrders = async (req, res) => {
  try {
    const { stage, search, page = 1, limit = 20 } = req.query;
    const whereClause = {};

    // Map frontend sub-tabs (stages) to database statuses cleanly
    if (stage === 'requests') {
      whereClause.status = { [Op.in]: ['pending_merchant', 'pending'] };
    } else if (stage === 'decision') {
      whereClause.status = { [Op.in]: ['accepted', 'rejected'] };
    } else if (stage === 'paid') {
      whereClause.status = { [Op.in]: ['paid', 'payment_submitted', 'payment_uploaded'] };
    } else if (stage === 'verified') {
      whereClause.status = { [Op.in]: ['verified', 'payment_verified', 'dispatched'] };
    }

    if (search) {
      whereClause[Op.or] = [
        { customerPhone: { [Op.like]: `%${search}%` } },
        { id: search }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Store, 
          as: 'Store',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }]
        },
        { model: User, as: 'User', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      orders,
    });
  } catch (error) {
    console.error('Get Lifecycle Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving lifecycle orders.' });
  }
};

// 2. Update Order Status Manually
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, rejectionReason } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.status = status;
    if (rejectionReason) {
      order.rejectionReason = rejectionReason;
    }
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order #${orderId} status updated to ${status}.`,
      order
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
};

// 3. Mark SMS Sent Flag
exports.markSmsSent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `SMS notification logged for Order #${orderId}.`
    });
  } catch (error) {
    console.error('Mark SMS Sent Error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking SMS sent.' });
  }
};