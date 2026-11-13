const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdPackage = sequelize.define('AdPackage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'AdPackages',
  timestamps: true
});

module.exports = AdPackage;