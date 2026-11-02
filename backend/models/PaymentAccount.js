// backend/models/PaymentAccount.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentAccount = sequelize.define('PaymentAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., "Commercial Bank of Ethiopia (CBE)", "Telebirr"
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountHolder: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  instructions: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
});

module.exports = PaymentAccount;