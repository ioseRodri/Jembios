const { Router } = require('express');
const db = require('../db/connect');
const router = Router();


function genTracking() {
  const base = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString().slice(-4);
  return `TRK-${base}${stamp}`;
}

/**
 * POST /api/deliveries
 * Body: { orderId: number, carrier?: string }
 * Regla: solo crear si la orden está 'paid' y no existe un delivery previo activo.
 * Efecto: crea delivery en estado 'created' con tracking_code.
 */
router.post('/', async (req, res) => {
  const { orderId, carrier } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId es requerido' });

  try {
    
    const order = await new Promise((resolve, reject) => {
      db.get(`SELECT id, status FROM orders WHERE id = ?`, [orderId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status !== 'paid') {
      return res.status(400).json({ error: `La orden debe estar 'paid' (actual: '${order.status}')` });
    }

    
    const existing = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM deliveries WHERE order_id = ?`, [orderId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un delivery para esta orden' });
    }

    const tracking = genTracking();

    
    const deliveryId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO deliveries (order_id, status, tracking_code, carrier, updated_at)
         VALUES (?, 'created', ?, ?, datetime('now'))`,
        [orderId, tracking, carrier || null],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    
    

    res.status(201).json({ id: deliveryId, order_id: orderId, status: 'created', tracking_code: tracking, carrier: carrier || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/deliveries
 * Query opcional: orderId
 */
router.get('/', (req, res) => {
  const { orderId } = req.query;
  const where = [];
  const params = [];

  if (orderId) {
    where.push('order_id = ?');
    params.push(Number(orderId));
  }

  const sql = `
    SELECT id, order_id, status, tracking_code, carrier, updated_at
    FROM deliveries
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id DESC
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * PATCH /api/deliveries/:id
 * Body: { status: 'en_route' | 'delivered' | 'failed' }
 * Reglas de transición válidas:
 *   created -> en_route
 *   en_route -> delivered | failed
 * Efectos:
 *   - Si pasa a 'en_route': (opcional) orders.status = 'shipped'
 *   - Si pasa a 'delivered': orders.status = 'delivered'
 */
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id inválido' });
  if (!['en_route', 'delivered', 'failed'].includes(status)) {
    return res.status(400).json({ error: "status debe ser 'en_route', 'delivered' o 'failed'" });
  }

  try {
    const delivery = await new Promise((resolve, reject) => {
      db.get(`SELECT id, order_id, status FROM deliveries WHERE id = ?`, [id], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    if (!delivery) return res.status(404).json({ error: 'Delivery no encontrado' });

    
    const from = delivery.status;
    const valid =
      (from === 'created' && status === 'en_route') ||
      (from === 'en_route' && (status === 'delivered' || status === 'failed'));

    if (!valid) {
      return res.status(400).json({ error: `Transición inválida: ${from} -> ${status}` });
    }

    
    await new Promise((resolve, reject) => db.run('BEGIN', (err) => (err ? reject(err) : resolve())));

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE deliveries SET status = ?, updated_at = datetime('now') WHERE id = ?`,
        [status, id],
        (err) => (err ? reject(err) : resolve())
      );
    });

    if (status === 'en_route') {
      
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE orders SET status = 'shipped' WHERE id = ?`,
          [delivery.order_id],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    if (status === 'delivered') {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE orders SET status = 'delivered' WHERE id = ?`,
          [delivery.order_id],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));

    res.json({ ok: true, id, order_id: delivery.order_id, status });
  } catch (err) {
    try { await new Promise((resolve) => db.run('ROLLBACK', () => resolve())); } catch {}
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
