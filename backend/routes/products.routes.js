/*
 * Products routes module
 *
 * This file defines the API routes for CRUD operations on the `products` table.  In
 * addition to the existing GET, POST and DELETE handlers that the user shared,
 * this version adds a PATCH handler to support partial updates.  Without a
 * PATCH handler the frontend will receive a 404 Not Found response when it
 * tries to update a product (e.g. when deactivating products with zero
 * stock).  According to the HTTP specification, the PATCH method should be
 * used for partial modifications of a resource【394789400560401†L175-L188】.  The handler below
 * constructs an UPDATE statement dynamically based on whatever fields are
 * present in the request body and optionally updates the `imagen_url` if a
 * file has been uploaded.  If no fields are provided, it returns a 400.
 */

const { Router } = require('express');
const db = require('../db/connect');
const multer = require('multer');
const path = require('path');

const router = Router();

// Configure multer for saving uploaded images.  Files will be stored in the
// uploads/ directory with a timestamp-based filename.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

/*
 * GET /products
 *
 * Returns a list of products.  Supports optional query parameters for
 * searching by name/category and filtering by price range.  The handler also
 * performs a PRAGMA table_info query to check for optional columns (e.g.
 * description, certificado_url) and includes them in the SELECT list when
 * present.
 */
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

    const names = new Set((cols || []).map((c) => c.name));
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

/*
 * POST /products
 *
 * Creates a new product.  The request must include at least name, category
 * and price.  The uploaded image is saved and its filename is stored in
 * imagen_url.  Optional fields like stock, weight and description will
 * default to 0 or NULL when omitted.
 */
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
      description || null,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, product_id: this.lastID, imagen_url });
    }
  );
});

/*
 * PATCH /products/:id
 *
 * Partially updates a product.  Only the fields provided in the request body
 * will be changed; missing fields are left untouched.  The route also
 * supports uploading a new image via a multipart/form-data request.  If the
 * given id does not exist in the database, a 404 response is returned.
 */
router.patch('/:id', upload.single('image'), (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  // Collect allowed fields from the request body.  Convert numeric and
  // boolean values to appropriate types; convert truthy/falsey values for
  // active to 1 or 0.  Using PATCH allows clients to send only the fields
  // they wish to update【394789400560401†L175-L188】.
  const updatable = ['name', 'category', 'price', 'stock', 'weight', 'active', 'description'];
  const sets = [];
  const params = [];
  updatable.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      let value = req.body[field];
      if (field === 'price' || field === 'stock' || field === 'weight') {
        value = Number(value);
      }
      if (field === 'active') {
        // Accept boolean, string or number; map truthy to 1, falsey to 0.
        value = value === '0' || value === 0 || value === false ? 0 : 1;
      }
      sets.push(`${field} = ?`);
      params.push(value);
    }
  });
  // Handle uploaded image
  if (req.file) {
    sets.push('imagen_url = ?');
    params.push(req.file.filename);
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: 'No hay campos a actualizar' });
  }
  params.push(id);
  const sql = `UPDATE products SET ${sets.join(', ')} WHERE id = ?`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, updated_id: id });
  });
});

/*
 * DELETE /products/:id
 *
 * Deletes a product by id.  Before removal it checks whether the product
 * exists in the order_items table and returns a 409 if it is in use.  If
 * nothing was deleted (meaning the id wasn’t found), a 404 is returned.
 */
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