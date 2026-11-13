// models/index.js
const sequelize = require('../config/db');
const User = require('./User');
const Store = require('./Store');
const Product = require('./Product');
const Banner = require('./Banner');
const Order = require('./Order');
const PaymentAccount = require('./PaymentAccount');
const ActivityLog = require('./ActivityLog');
const BroadcastMessage = require('./BroadcastMessage');
const AdPackage = require('./AdPackage'); // 👈 1. Import AdPackage here

// User <-> Store Associations
User.hasOne(Store, { 
  foreignKey: { name: 'userId', field: 'user_id' }, 
  as: 'store',
  onDelete: 'CASCADE',
});

Store.belongsTo(User, { 
  foreignKey: { name: 'userId', field: 'user_id' }, 
  as: 'user',
});

// Store <-> Product Associations
if (Product) {
  Store.hasMany(Product, { foreignKey: 'storeId', as: 'products' });
  Product.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
}

// 🔗 Order Associations (Store & User)
if (Order && Store) {
  Order.belongsTo(Store, { foreignKey: 'storeId' });
  Store.hasMany(Order, { foreignKey: 'storeId' });
}

if (Order && User) {
  Order.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(Order, { foreignKey: 'userId' });
}

// 📢 Banner Associations (User & Store)
if (Banner && User) {
  Banner.belongsTo(User, { foreignKey: 'userId', as: 'User' });
  User.hasMany(Banner, { foreignKey: 'userId', as: 'Banners' });
}

if (Banner && Store) {
  Banner.belongsTo(Store, { foreignKey: 'storeId', as: 'Store' });
  Store.hasMany(Banner, { foreignKey: 'storeId', as: 'Banners' });
}

module.exports = {
  sequelize,
  User,
  Store,
  Product,
  Banner,
  Order,
  PaymentAccount, 
  ActivityLog,
  BroadcastMessage,
  AdPackage, // 👈 2. Export AdPackage here
};