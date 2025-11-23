
const fs = require('fs');
const path = require('path');
const db = require('./connect');

const sqlPath = path.join(__dirname, 'migrate-auth-marketing.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Error migración:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Migración auth/marketing OK');
    process.exit(0);
  }
});
