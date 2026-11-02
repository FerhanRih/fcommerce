// models/Store.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'store_name',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bankAccounts: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: [],
    field: 'bank_accounts',
  }, 
  landmark: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  logoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'logo_url',
  },
  isLocationVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_location_verified',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending', // 'pending' | 'approved' | 'rejected'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
}, {
  tableName: 'stores',
  timestamps: true,
  updatedAt: false,
});

module.exports = Store;