// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // 👈 Using your centralized Cloudinary middleware
const { protect } = require('../middleware/authMiddleware');

const adminController = require('../controllers/adminController');
const adminOrderController = require('../controllers/adminOrderController');
const adminDeliveryController = require('../controllers/adminDeliveryController');
const adminStoreController = require('../controllers/adminStoreController');
const adminAdController = require('../controllers/adminAdController');
const adminRoleController = require('../controllers/adminRoleController');
const adminFleetController = require('../controllers/adminFleetController');
const adminIntelligenceController = require('../controllers/adminIntelligenceController');
const adminBroadcastController = require('../controllers/adminBroadcastController');

// 🛡️ Safe wrapper to catch undefined controller functions instantly
const checkHandler = (fn, name) => {
  if (typeof fn !== 'function') {
    console.error(`❌ CRITICAL ROUTE ERROR: Controller function '${name}' is undefined! Check your controller exports.`);
    return (req, res) => res.status(500).json({ success: false, message: `Handler ${name} is missing or not exported.` });
  }
  return fn;
};

// Middleware to ensure user is Super Admin or Admin
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Super Admin authorization required.' });
};

// 1. Dashboard Stats (Page 1)
router.get('/dashboard-stats', protect, requireAdmin, checkHandler(adminController.getDashboardStats, 'adminController.getDashboardStats'));

// 2. Master All Orders Audit (Page 8)
router.get('/all-orders', protect, requireAdmin, checkHandler(adminController.getAllOrders, 'adminController.getAllOrders'));

// 3. Order Lifecycle Hub (Page 2)
router.get('/lifecycle-orders', protect, requireAdmin, checkHandler(adminController.getLifecycleOrders, 'adminController.getLifecycleOrders'));
router.put('/orders/:orderId/status', protect, requireAdmin, checkHandler(adminOrderController.updateOrderStatus, 'adminOrderController.updateOrderStatus'));
router.put('/orders/:orderId/sms-sent', protect, requireAdmin, checkHandler(adminOrderController.markSmsSent, 'adminOrderController.markSmsSent'));

// 4. Delivery Hub (Page 3)
router.get('/delivery-orders', protect, requireAdmin, checkHandler(adminDeliveryController.getDeliveryOrders, 'adminDeliveryController.getDeliveryOrders'));
router.put('/delivery-orders/:orderId/status', protect, requireAdmin, checkHandler(adminDeliveryController.updateDeliveryStatus, 'adminDeliveryController.updateDeliveryStatus'));

// 5. Store Approvals (Page 4)
router.get('/store-approvals', protect, requireAdmin, checkHandler(adminStoreController.getStoreApprovals, 'adminStoreController.getStoreApprovals'));
router.put('/store-approvals/:storeId', protect, requireAdmin, checkHandler(adminStoreController.updateStoreApproval, 'adminStoreController.updateStoreApproval'));

// 6. Ad Banners & Payment Accounts (Page 5)
router.get('/ad-banners', protect, requireAdmin, checkHandler(adminAdController.getAdBanners, 'adminAdController.getAdBanners'));
router.put('/ad-banners/:bannerId', protect, requireAdmin, checkHandler(adminAdController.updateAdStatus, 'adminAdController.updateAdStatus'));
router.post('/ad-banners/create', protect, requireAdmin, upload.single('image'), checkHandler(adminAdController.createAdminAd, 'adminAdController.createAdminAd'));

router.get('/ad-packages', protect, requireAdmin, checkHandler(adminAdController.getAdminPackages, 'adminAdController.getAdminPackages'));
router.put('/ad-packages/:id', protect, requireAdmin, checkHandler(adminAdController.updatePackage, 'adminAdController.updatePackage'));

// Payment Accounts Routes
router.get('/payment-accounts', checkHandler(adminAdController.getPaymentAccounts, 'adminAdController.getPaymentAccounts'));
router.post('/payment-accounts', protect, requireAdmin, checkHandler(adminAdController.savePaymentAccount, 'adminAdController.savePaymentAccount'));
router.delete('/payment-accounts/:id', protect, requireAdmin, checkHandler(adminAdController.deletePaymentAccount, 'adminAdController.deletePaymentAccount'));

router.get('/stores', protect, requireAdmin, checkHandler(adminStoreController.getAdminStores, 'adminStoreController.getAdminStores'));
router.put('/stores/:storeId/status', protect, requireAdmin, checkHandler(adminStoreController.updateStoreStatus, 'adminStoreController.updateStoreStatus'));
router.delete('/stores/:storeId', protect, requireAdmin, checkHandler(adminStoreController.deleteStore, 'adminStoreController.deleteStore'));

router.get('/staff-users', protect, requireAdmin, checkHandler(adminRoleController.getStaffUsers, 'adminRoleController.getStaffUsers'));
router.put('/update-role', protect, requireAdmin, checkHandler(adminRoleController.updateUserRole, 'adminRoleController.updateUserRole'));
router.post('/update-role', protect, requireAdmin, checkHandler(adminRoleController.updateUserRole, 'adminRoleController.updateUserRole')); 
router.delete('/staff-users/:id', protect, requireAdmin, checkHandler(adminRoleController.deleteStaffUser, 'adminRoleController.deleteStaffUser'));

// 8. Fleet Logistics Hub (Page 7)
router.get('/fleet', protect, requireAdmin, checkHandler(adminFleetController.getFleetOverview, 'adminFleetController.getFleetOverview'));
router.post('/fleet/drivers', protect, requireAdmin, checkHandler(adminFleetController.addDriver, 'adminFleetController.addDriver'));
router.put('/fleet/drivers/:driverId/status', protect, requireAdmin, checkHandler(adminFleetController.updateDriverStatus, 'adminFleetController.updateDriverStatus'));

// 9. Marketplace Intelligence Leaderboard (Page 9)
router.get('/marketplace-intelligence', protect, requireAdmin, checkHandler(adminIntelligenceController.getMarketplaceIntelligence, 'adminIntelligenceController.getMarketplaceIntelligence'));

router.get('/platform-status', checkHandler(adminController.getPlatformStatus, 'adminController.getPlatformStatus'));
router.put('/platform-status', protect, requireAdmin, checkHandler(adminController.updatePlatformStatus, 'adminController.updatePlatformStatus'));

router.post('/broadcast', protect, requireAdmin, checkHandler(adminBroadcastController.sendBroadcast, 'adminBroadcastController.sendBroadcast'));
router.get('/broadcast-client', checkHandler(adminBroadcastController.getClientBroadcasts, 'adminBroadcastController.getClientBroadcasts'));

module.exports = router;