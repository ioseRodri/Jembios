
const { Router } = require('express');
const db = require('../db/connect');
const router = Router();

function statusFromActive(active) {
  return Number(active) === 1 ? 'ACTIVO' : 'INACTIVO';
}
function activeFromStatus(status) {
  return (status || '').toUpperCase() === 'INACTIVO' ? 0 : 1;
}


router.get('/', (req, res) => {
  db.all(`SELECT id, name, role, active FROM employees ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const mapped = rows.map(r => ({ id: r.id, name: r.name, role: r.role, status: statusFromActive(r.active) }));
    res.json(mapped);
  });
});


router.post('/', (req, res) => {
  const { name, role, status = 'ACTIVO' } = req.body || {};
  if (!name || !role) return res.status(400).json({ error: 'name y role son obligatorios' });

  const active = activeFromStatus(status);
  db.run(
    `INSERT INTO employees(name, role, active) VALUES(?,?,?)`,
    [name, role, active],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(
        `SELECT id, name, role, active FROM employees WHERE id=?`,
        [this.lastID],
        (e2, row) => {
          if (e2) return res.status(500).json({ error: e2.message });
          res.status(201).json({ id: row.id, name: row.name, role: row.role, status: statusFromActive(row.active) });
        }
      );
    }
  );
});


router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });
  const { name, role, status } = req.body || {};

  db.get(`SELECT * FROM employees WHERE id=?`, [id], (err, cur) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cur) return res.status(404).json({ error: 'Empleado no encontrado' });

    const newName = name ?? cur.name;
    const newRole = role ?? cur.role;
    const newActive = typeof status === 'string' ? activeFromStatus(status) : cur.active;

    db.run(
      `UPDATE employees SET name=?, role=?, active=? WHERE id=?`,
      [newName, newRole, newActive, id],
      (e2) => {
        if (e2) return res.status(500).json({ error: e2.message });
        db.get(`SELECT id, name, role, active FROM employees WHERE id=?`, [id], (e3, row) => {
          if (e3) return res.status(500).json({ error: e3.message });
          res.json({ id: row.id, name: row.name, role: row.role, status: statusFromActive(row.active) });
        });
      }
    );
  });
});

module.exports = router;
