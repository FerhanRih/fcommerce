// backend/models/BroadcastMessage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BroadcastMessage = sequelize.define('BroadcastMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  target: {
    type: DataTypes.STRING, // 'users', 'vendors', or 'both'
    defaultValue: 'both',
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = BroadcastMessage;