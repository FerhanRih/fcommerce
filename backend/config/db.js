const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fcommerce',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 4000, // TiDB default port is 4000
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,       // Tight pool limit to protect TiDB's connection count
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for TiDB Cloud secure connection
      },
      connectTimeout: 60000
    }
  }
);

module.exports = sequelize;