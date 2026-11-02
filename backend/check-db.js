// check-db.js
const sequelize = require('./config/db');

async function inspectStoresTable() {
  try {
    const [columns] = await sequelize.query("DESCRIBE stores;");
    console.table(columns.map(col => ({ Field: col.Field, Type: col.Type })));
  } catch (error) {
    console.error(error.message);
  } finally {
    await sequelize.close();
  }
}

inspectStoresTable();