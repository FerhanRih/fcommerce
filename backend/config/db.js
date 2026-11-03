const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'defaultdb',
  process.env.DB_USER || 'avnadmin',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 26484,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;