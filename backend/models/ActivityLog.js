// backend/models/ActivityLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  actionType: {
    type: DataTypes.STRING(100),
    allowNull: false, // e.g., 'APPROVE_STORE', 'REJECT_BANNER', 'UPDATE_ROLE'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'activity_logs',
  timestamps: true,
});

module.exports = ActivityLog;