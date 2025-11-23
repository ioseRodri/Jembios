
const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db/connect');

const router = Router();


const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
});
const upload = multer({ storage });


router.get('/productos/pendientes', (req, res) => {
  const sql = `SELECT * FROM productos_pendientes WHERE estado = 'pendiente' ORDER BY id_pendiente DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});


router.post(
  '/productos',
  upload.fields([
    { name: 'imagenes', maxCount: 1 },
    { name: 'certificados', maxCount: 1 },
  ]),
  (req, res) => {
    const {
      nombre,
      principioActivo,
      descripcion,
      sku,
      precio,
      categoria,
    } = req.body || {};

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'nombre, precio y categoria son requeridos' });
    }

    const imagenFile = (req.files?.imagenes?.[0]?.filename) || null;
    const certFile = (req.files?.certificados?.[0]?.filename) || null;

    const sql = `
      INSERT INTO productos_pendientes(
        nombre, principio_activo, descripcion, sku, precio, categoria, imagen_url, certificado_url, estado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `;

    const params = [
      nombre,
      principioActivo || null,
      descripcion || null,
      sku || null,
      Number(precio),
      categoria,
      imagenFile,
      certFile,
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, id_pendiente: this.lastID });
    });
  }
);


router.patch('/productos/:id/aprobar', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const sel = `SELECT * FROM productos_pendientes WHERE id_pendiente = ? AND estado = 'pendiente'`;
  db.get(sel, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No encontrado o ya aprobado' });

    
    const ins = `
      INSERT INTO products (name, category, price, stock, weight, active, imagen_url, certificado_url)
      VALUES (?, ?, ?, 0, 0, 1, ?, ?)
    `;
    db.run(
      ins,
      [row.nombre, 'Maquinaria Certificada', row.precio, row.imagen_url, row.certificado_url],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        
        const upd = `UPDATE productos_pendientes SET estado = 'aprobado' WHERE id_pendiente = ?`;
        db.run(upd, [id], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ ok: true, product_id: this.lastID });
        });
      }
    );
  });
});


router.get('/productos/aprobados', (req, res) => {
  const sql = `SELECT * FROM productos_pendientes WHERE estado = 'aprobado' ORDER BY id_pendiente DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});



router.post(
  '/productos/directo',
  upload.single('imagenes'), 
  (req, res) => {
    const { nombre, categoria, precio, stock, weight, active } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'nombre, precio y categoria son requeridos' });
    }

    const imagenFile = req.file?.filename || null;

    const sql = `
      INSERT INTO products
      (name, category, price, stock, weight, active, imagen_url, certificado_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `;

    const params = [
      nombre,
      categoria,
      Number(precio),
      Number(stock) || 0,
      Number(weight) || 0,
      active === "1" || active === true ? 1 : 0,
      imagenFile,
    ];

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, product_id: this.lastID });
    });
  }
);



router.patch('/productos/:id/rechazar', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM productos_pendientes WHERE id_pendiente = ?', [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'Error al rechazar producto' });
    }
    res.json({ ok: true, id_rechazado: id });
  });
});

module.exports = router;
