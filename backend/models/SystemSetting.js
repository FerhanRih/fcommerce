// backend/models/SystemSetting.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust to your DB config path

const SystemSetting = sequelize.define('SystemSetting', {
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = SystemSetting;