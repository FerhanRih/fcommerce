const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  storeId: { type: DataTypes.INTEGER, allowNull: false },
  items: { type: DataTypes.JSON, allowNull: false }, 
  subtotal: { type: DataTypes.DOUBLE, allowNull: false },
  deliveryFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  totalAmount: { type: DataTypes.DOUBLE, allowNull: false },
  deliveryAddress: { type: DataTypes.JSON, allowNull: false }, 
deliveryPin: {
  type: DataTypes.STRING(4),
  allowNull: true,
  field: 'delivery_pin',
},
  
  status: { type: DataTypes.STRING, defaultValue: 'pending_merchant' },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  
 
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  
  
  paymentReceiptUrl: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Order;