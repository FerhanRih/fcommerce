// backend/models/Driver.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  vehicleType: {
    type: DataTypes.STRING(50), // 'Motorcycle', 'Van', 'Truck'
    defaultValue: 'Motorcycle',
  },
  plateNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('available', 'on_trip', 'offline'),
    defaultValue: 'available',
  },
}, {
  tableName: 'drivers',
  timestamps: true,
});

module.exports = Driver;