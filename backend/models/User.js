// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false, // Stores the hashed bcrypt password
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('customer', 'vendor', 'delivery', 'admin', 'superadmin', 'call_center', 'staff'),
    defaultValue: 'customer',
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at', // Maps JS createdAt to MySQL created_at
  },
}, {
  tableName: 'users',
  timestamps: true,
  updatedAt: false, // Tells Sequelize NOT to query for updated_at
});

module.exports = User;