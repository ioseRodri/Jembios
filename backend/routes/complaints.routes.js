const { Router } = require('express');
const db = require('../db/connect');
const router = Router();

/**
 * POST /api/complaints
 * Body: { orderId: number, reason: string }
 * Regla: solo si la orden existe; cualquier estado. (Si quieres, restringe a 'delivered'.)
 */
router.post('/', (req, res) => {
  const { orderId, reason } = req.body || {};
  if (!orderId || !reason) return res.status(400).json({ error: 'orderId y reason son requeridos' });

  db.get(`SELECT id FROM orders WHERE id = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    db.run(
      `INSERT INTO complaints (order_id, reason, status) VALUES (?, ?, 'open')`,
      [orderId, reason],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ id: this.lastID, order_id: orderId, status: 'open' });
      }
    );
  });
});

/**
 * GET /api/complaints
 * Query opcional: orderId, status
 */
router.get('/', (req, res) => {
  const { orderId, status } = req.query;
  const where = [];
  const params = [];

  if (orderId) { where.push('c.order_id = ?'); params.push(Number(orderId)); }
  if (status)  { where.push('c.status = ?');   params.push(status); }

  const sql = `
    SELECT c.id, c.order_id, c.reason, c.status, c.created_at
    FROM complaints c
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY c.created_at DESC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * PATCH /api/complaints/:id
 * Body: { status: 'resolved' | 'rejected' }
 * Efecto adicional (opcional demo): si 'resolved' y la orden estaba 'delivered',
 * podrías marcar payment como 'refunded' (simulado).
 */
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id inválido' });
  if (!['resolved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status debe ser 'resolved' o 'rejected'" });
  }

  try {
    
    const complaint = await new Promise((resolve, reject) => {
      db.get(`SELECT id, order_id, status FROM complaints WHERE id = ?`, [id], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    if (!complaint) return res.status(404).json({ error: 'Reclamo no encontrado' });

    await new Promise((resolve, reject) => db.run('BEGIN', (err) => (err ? reject(err) : resolve())));

    
    await new Promise((resolve, reject) => {
      db.run(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id], (err) =>
        err ? reject(err) : resolve()
      );
    });

    
    if (status === 'resolved') {
      
      const lastPayment = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
          [complaint.order_id],
          (err, row) => (err ? reject(err) : resolve(row))
        );
      });
      if (lastPayment) {
        await new Promise((resolve, reject) => {
          db.run(`UPDATE payments SET status = 'refunded' WHERE id = ?`, [lastPayment.id], (err) =>
            err ? reject(err) : resolve()
          );
        });
      }
      
    }

    await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));

    res.json({ ok: true, id, order_id: complaint.order_id, status });
  } catch (err) {
    try { await new Promise((resolve) => db.run('ROLLBACK', () => resolve())); } catch {}
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
