
const db = require('./connect'); 

function hasColumn(table, column) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
      if (err) return reject(err);
      const exists = (rows || []).some(c => c.name === column);
      resolve(exists);
    });
  });
}

async function main() {
  try {
    const exists = await hasColumn('products', 'description');
    if (exists) {
      console.log('✅ La columna "description" ya existe en products. Nada que hacer.');
      db.close();
      return;
    }

    await new Promise((resolve, reject) =>
      db.run(`ALTER TABLE products ADD COLUMN description TEXT`, [], (err) => err ? reject(err) : resolve())
    );

    console.log('✅ Migración aplicada: products.description (TEXT) creada.');
  } catch (e) {
    console.error('❌ Error en migración:', e.message);
    process.exit(1);
  } finally {
    try { db.close(); } catch {}
  }
}

main();
