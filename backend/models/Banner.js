// backend/models/Banner.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cta: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'EXPLORE CATALOG',
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'SPONSORED AD',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false, // Banner artwork
  },
  paymentReceiptUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Payment screenshot upload
  },
  linkUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  packageName: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Standard Campaign',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7, // Default 7 days
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending', // 'pending', 'active', 'rejected'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Active only when approved
  },
});

module.exports = Banner;