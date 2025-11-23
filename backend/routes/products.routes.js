const { Router } = require('express');
const db = require('../db/connect');
const router = Router();
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), 
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });


router.get('/', (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  const where = [];
  const params = [];

  if (q) {
    where.push('(name LIKE ? OR category LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (minPrice) {
    where.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where.push('price <= ?');
    params.push(Number(maxPrice));
  }

  
  db.all(`PRAGMA table_info(products)`, [], (eCols, cols) => {
    if (eCols) return res.status(500).json({ error: eCols.message });

    const names = new Set((cols || []).map(c => c.name));

    
    
    const selectCols = [
      'id',
      'name',
      'category',
      'price',
      'stock',
      'weight',
      'active',
      'imagen_url',
      names.has('description') ? 'description' : 'NULL AS description',
      names.has('certificado_url') ? 'certificado_url' : 'NULL AS certificado_url',
      names.has('created_at') ? 'created_at' : 'NULL AS created_at',
    ].join(', ');


    const sql = `
      SELECT ${selectCols}
      FROM products
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY id DESC
      LIMIT 500
    `;

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});





router.post('/', upload.single('image'), (req, res) => {
  const { name, category, price, stock, weight, active, description } = req.body;
  const imagen_url = req.file ? req.file.filename : null;


  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const sql = `
  INSERT INTO products 
    (name, category, price, stock, weight, active, imagen_url, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;


  db.run(
    sql,
    [
      name,
      category,
      Number(price),
      Number(stock) || 0,
      Number(weight) || 0,
      active ? 1 : 0,
      imagen_url,
      description || null
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, product_id: this.lastID, imagen_url });
    }
  );
});






router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  
  db.get(`SELECT 1 AS used FROM order_items WHERE product_id = ? LIMIT 1`, [id], (e, row) => {
    if (e) return res.status(500).json({ error: e.message });
    if (row?.used) return res.status(409).json({ error: 'No se puede eliminar: el producto ya está referenciado en órdenes' });

    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ ok: true });
    });
  });
});



module.exports = router;
