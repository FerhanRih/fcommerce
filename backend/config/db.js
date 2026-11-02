const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('fcommerce_db2', 'fcommerce_user', 'MyProjectPass123!', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: console.log, // Changed from false to print exact SQL errors
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;