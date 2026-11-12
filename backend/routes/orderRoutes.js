const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Store = require('../models/Store'); // 👈 Explicitly imported at the top
const upload = require('../middleware/uploadMiddleware'); // Multer config
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');
const { SystemSetting } = require('../models');

const getPlatformStatus = async () => {
  try {
    const setting = await SystemSetting.findOne({ where: { key: 'storefrontOpen' } });
    if (setting) {
      return JSON.parse(setting.value);
    }
  } catch (e) {
    console.error('Error reading platform settings from DB:', e);
  }
  return true; // default open
};
// 0.2 Request Order Endpoint with Multi-Merchant Cart Splitting & Platform Kill-Switch
router.post('/request', protect, async (req, res) => {
  try {
    const isPlatformOpen = await getPlatformStatus();
    if (!isPlatformOpen) {
      return res.status(503).json({
        success: false,
        message: '⚠️ F-COMMERCE is currently undergoing scheduled maintenance or order capacity optimization. New orders are temporarily paused. Please check back shortly!'
      });
    }

    const { items, deliveryFee, deliveryAddress } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // 1. Group cart items by storeId
    const itemsByStore = {};
    items.forEach((item) => {
      const storeId = item.storeId || item.StoreId || 1;
      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = [];
      }
      itemsByStore[storeId].push(item);
    });

    const createdOrders = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10-minute timer per merchant order

    // 2. Create an independent Order record for each store
    for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
      let subtotal = 0;
      storeItems.forEach((item) => {
        subtotal += Number(item.price || 0) * Number(item.quantity || 1);
      });

      const storeDeliveryFee = Number(deliveryFee || 200);
      const totalAmount = subtotal + storeDeliveryFee;

      const newOrder = await Order.create({
        storeId: Number(storeId),
        userId: req.user ? req.user.id : null,
        customerPhone: req.user ? req.user.phone : null,
        customerName: req.user ? req.user.name : 'Customer',
        items: storeItems,
        subtotal,
        deliveryFee: storeDeliveryFee,
        totalAmount,
        deliveryAddress: deliveryAddress || {},
        status: 'pending_merchant',
        expiresAt,
      });

      createdOrders.push(newOrder);
    }

    // 3. Return both 'orders' (array) and 'order' (first primary order for frontend compatibility)
    return res.status(200).json({
      success: true,
      message: `Successfully split cart into ${createdOrders.length} merchant order(s).`,
      order: createdOrders[0],
      orders: createdOrders,
    });
  } catch (error) {
    console.error('Multi-Merchant Order Request Error:', error);
    return res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
});
// 📍 1. SPECIFIC VENDOR ROUTE MUST COME BEFORE /:id
router.get('/vendor/:storeId', protect, async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🔍 [MERCHANT FETCH] Merchant is requesting orders for storeId: ${storeId}`);
    
    const orders = await Order.findAll({
      where: { storeId: Number(storeId) },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Fetch Vendor Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching vendor orders' });
  }
});

router.get('/user/:phone', protect, async (req, res) => {
  try {
    // Use the authenticated user's ID instead of looking up by missing customerPhone column
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']],
    });

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const store = await Store.findByPk(order.storeId);
        let storeData = store ? store.toJSON() : null;

        if (storeData && storeData.bankAccounts) {
          if (typeof storeData.bankAccounts === 'string') {
            try {
              storeData.bankAccounts = JSON.parse(storeData.bankAccounts);
            } catch (e) {
              storeData.bankAccounts = [];
            }
          }
        }

        return {
          ...order.toJSON(),
          store: storeData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Fetch User Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching user orders.' });
  }
});

// GET /api/orders/:id - Single Order Status for Customer
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // CRITICAL: Fetch the merchant store so bank accounts are sent to the customer page
    const store = await Store.findByPk(order.storeId);
    let storeData = store ? store.toJSON() : null;

    if (storeData && storeData.bankAccounts) {
      if (typeof storeData.bankAccounts === 'string') {
        try {
          storeData.bankAccounts = JSON.parse(storeData.bankAccounts);
        } catch (e) {
          storeData.bankAccounts = [];
        }
      }
    }

    const now = new Date();
    const expiresAt = new Date(order.expiresAt);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return res.status(200).json({
      success: true,
      order: {
        ...order.toJSON(),
        store: storeData, // Attach store details here!
      },
      remainingSeconds,
    });
  } catch (error) {
    console.error('Fetch Order Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
});

// 3. Merchant Decision Endpoint (Accept or Reject with Item-Level Adjustments & Bank Validation)
router.put('/:id/merchant-response', protect, async (req, res) => {
  try {
    const { action, rejectionReason, rejectedItemIds = [], adjustedItems = {} } = req.body;
    
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const now = new Date();
    if (order.expiresAt && now > new Date(order.expiresAt) && order.status === 'pending_merchant') {
      await order.update({ status: 'expired' });
      return res.status(400).json({
        success: false,
        message: 'Order request has expired (10 min timer ended).',
      });
    }

    if (action === 'reject') {
      await order.update({
        status: 'rejected',
        rejectionReason: rejectionReason || 'Store is currently out of stock or unavailable.',
      });

      return res.status(200).json({
        success: true,
        message: 'Order rejected successfully',
        order,
      });
    }

    if (action === 'accept') {
      const store = await Store.findByPk(order.storeId);

      let bankAccounts = store?.bankAccounts;
      if (typeof bankAccounts === 'string') {
        try {
          bankAccounts = JSON.parse(bankAccounts);
        } catch (e) {
          bankAccounts = [];
        }
      }

      // STOPS ACCEPTANCE IF NO VALID ACCOUNT OR PHONE NUMBER IS PRESENT
      const validAccounts = Array.isArray(bankAccounts)
        ? bankAccounts.filter(
            (acc) =>
              acc &&
              String(acc.accountNumber || '').trim() !== '' &&
              String(acc.accountHolder || '').trim() !== ''
          )
        : [];

      if (validAccounts.length === 0) {
        return res.status(400).json({
          success: false,
          needsBankSetup: true,
          message: 'Please configure at least one valid bank or mobile money account in settings before accepting order requests.',
        });
      }

      let rawItems = order.items;
      if (typeof rawItems === 'string') {
        try {
          rawItems = JSON.parse(rawItems);
        } catch (e) {
          rawItems = [];
        }
      }

      let newSubtotal = 0;
      const updatedItems = Array.isArray(rawItems)
        ? rawItems.map((item) => {
            const itemIdStr = String(item.id);
            const isItemRejected = rejectedItemIds.map(String).includes(itemIdStr);

            if (isItemRejected) {
              return {
                ...item,
                approvedQuantity: 0,
                status: 'rejected',
              };
            }

            const approvedQty = adjustedItems[itemIdStr] !== undefined
              ? Number(adjustedItems[itemIdStr])
              : Number(item.quantity);

            const itemPrice = Number(item.price || 0);
            newSubtotal += itemPrice * approvedQty;

            return {
              ...item,
              approvedQuantity: approvedQty,
              status: 'approved',
            };
          })
        : [];

      const deliveryFee = Number(order.deliveryFee || 0);
      const newTotalAmount = newSubtotal + deliveryFee;

      await order.update({
        status: 'accepted',
        items: updatedItems,
        subtotal: newSubtotal,
        totalAmount: newTotalAmount,
        rejectionReason: rejectionReason || null,
      });

      return res.status(200).json({
        success: true,
        message: 'Order accepted with item adjustments updated successfully',
        order,
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action provided.' });
  } catch (error) {
    console.error('Merchant Response Error:', error);
    return res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
  }
});
// 1. Bank Transfer Receipt Upload (Updated for Cloudinary)
router.put('/:id/upload-receipt', protect, upload.single('receipt'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!req.file && !req.body.receiptUrl) {
      return res.status(400).json({ success: false, message: 'Please attach a payment receipt image.' });
    }

    // ☁️ Use req.file.path so Cloudinary's permanent HTTPS URL is saved correctly
    const receiptUrl = req.file ? req.file.path : req.body.receiptUrl;

    await order.update({
      paymentReceiptUrl: receiptUrl,
      status: 'payment_uploaded',
    });

    return res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully. Order is pending merchant verification.',
      order,
    });
  } catch (error) {
    console.error('Receipt Upload Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload receipt screenshot' });
  }
});
// 2. Verify Payment & Approve Dispatch
router.put('/:id/verify-payment', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const nextStatus = status || 'payment_verified';
    const deliveryPin = order.deliveryPin || Math.floor(1000 + Math.random() * 9000).toString();

    await order.update({ 
      status: nextStatus,
      deliveryPin: deliveryPin
    });

    // Explicitly return 200 OK with success: true
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order,
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify payment.' });
  }
});
// 6. Update General Order Status (e.g. Delivered with PIN Verification)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, pin } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🛡️ Validate 4-digit PIN when marking as delivered
    if (status === 'delivered') {
      if (!pin || pin.toString().trim() !== order.deliveryPin?.toString().trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid 4-digit delivery PIN! Please request the valid PIN from the buyer.' 
        });
      }
    }

    await order.update({ status });

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      order,
    });
  } catch (error) {
    console.error('Status Update Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;