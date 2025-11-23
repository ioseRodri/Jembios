const { Router } = require('express');
const db = require('../db/connect');
const router = Router();

/**
 * Mapeos de estado para UI
 */
function toUiStatus(dbStatus) {
  const s = String(dbStatus || '').toLowerCase();
  if (s === 'done') return 'CUMPLIDO';
  return 'TRABAJANDO'; 
}
function toDbStatus(uiStatus) {
  const s = (uiStatus || '').toUpperCase();
  if (s === 'CUMPLIDO') return 'done';
  if (s === 'TRABAJANDO') return 'in_progress';
  return null; 
}

/**
 * GET /api/tasks
 * Query opcional: status (pending|in_progress|done) o orderId
 */
router.get('/', (req, res) => {
  const { status, orderId } = req.query;
  const where = [];
  const params = [];

  if (status) { where.push('t.status = ?'); params.push(status); }
  if (orderId) { where.push('t.order_id = ?'); params.push(Number(orderId)); }

  const sql = `
    SELECT t.id, t.order_id, t.assignee_id, e.name AS assignee_name, t.type, t.status, t.created_at
    FROM tasks t
    LEFT JOIN employees e ON e.id = t.assignee_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY t.created_at DESC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const mapped = rows.map(r => ({ ...r, ui_status: toUiStatus(r.status) }));
    res.json(mapped);
  });
});

/**
 * POST /api/tasks
 * Body: { employeeId:number, orderId:number, type:'Empaquetado'|'Revisión'|'Entrega' }
 * Crea tarea con estado inicial "TRABAJANDO" (DB: in_progress)
 */
router.post('/', (req, res) => {
  const { employeeId, orderId, type } = req.body || {};
  const allowed = ['Empaquetado', 'Revisión', 'Entrega'];

  if (!employeeId || !orderId || !type) {
    return res.status(400).json({ error: 'employeeId, orderId y type son obligatorios' });
  }
  if (!allowed.includes(type)) {
    return res.status(400).json({ error: 'type inválido' });
  }

  
  db.get(`SELECT id FROM employees WHERE id = ? AND active = 1`, [Number(employeeId)], (eEmp, emp) => {
    if (eEmp) return res.status(500).json({ error: eEmp.message });
    if (!emp) return res.status(400).json({ error: 'Empleado inexistente o inactivo' });

    
    db.get(`SELECT id FROM orders WHERE id = ?`, [Number(orderId)], (eOrd, ord) => {
      if (eOrd) return res.status(500).json({ error: eOrd.message });
      if (!ord) return res.status(400).json({ error: 'Orden no encontrada' });

      db.run(
        `INSERT INTO tasks (order_id, assignee_id, type, status) VALUES (?, ?, ?, 'in_progress')`,
        [Number(orderId), Number(employeeId), type],
        function (eIns) {
          if (eIns) return res.status(500).json({ error: eIns.message });
          db.get(
            `SELECT t.id, t.order_id, t.assignee_id, e.name AS assignee_name, t.type, t.status, t.created_at
             FROM tasks t LEFT JOIN employees e ON e.id = t.assignee_id WHERE t.id=?`,
            [this.lastID],
            (eGet, row) => {
              if (eGet) return res.status(500).json({ error: eGet.message });
              res.status(201).json({ ...row, ui_status: toUiStatus(row.status) });
            }
          );
        }
      );
    });
  });
});

/**
 * PATCH /api/tasks/:id
 * Body: { status?: 'pending'|'in_progress'|'done'|'TRABAJANDO'|'CUMPLIDO', assignee_id?: number }
 * Permite actualizar con estados DB o con los de UI; si viene 'TRABAJANDO'/'CUMPLIDO' lo convertimos.
 */
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  if (!id) return res.status(400).json({ error: 'id inválido' });

  const sets = [];
  const params = [];

  if (body.status) {
    const dbStatus = ['pending', 'in_progress', 'done'].includes(String(body.status))
      ? String(body.status)
      : toDbStatus(body.status); 
    if (!dbStatus) return res.status(400).json({ error: 'status inválido' });
    sets.push('status = ?'); params.push(dbStatus);
  }
  if (typeof body.assignee_id === 'number') {
    sets.push('assignee_id = ?'); params.push(body.assignee_id);
  }

  if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
  params.push(id);

  db.run(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Task no encontrada' });
    
    db.get(
      `SELECT t.id, t.order_id, t.assignee_id, e.name AS assignee_name, t.type, t.status, t.created_at
       FROM tasks t LEFT JOIN employees e ON e.id = t.assignee_id WHERE t.id=?`,
      [id],
      (e2, row) => {
        if (e2) return res.status(500).json({ error: e2.message });
        res.json({ ...row, ui_status: toUiStatus(row.status) });
      }
    );
  });
});

/**
 * PATCH /api/tasks/:id/complete
 * Marca como CUMPLIDO (DB: done)
 */
router.patch('/:id/complete', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  db.run(`UPDATE tasks SET status = 'done' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Task no encontrada' });

    db.get(
      `SELECT t.id, t.order_id, t.assignee_id, e.name AS assignee_name, t.type, t.status, t.created_at
       FROM tasks t LEFT JOIN employees e ON e.id = t.assignee_id WHERE t.id=?`,
      [id],
      (e2, row) => {
        if (e2) return res.status(500).json({ error: e2.message });
        res.json({ ...row, ui_status: toUiStatus(row.status) });
      }
    );
  });
});

module.exports = router;
