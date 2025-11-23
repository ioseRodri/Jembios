const { Router } = require('express');
const db = require('../db/connect');
const router = Router();


/**
 * Helpers simples:
 */
function getCouponIfValid(code, amount) {
  return new Promise((resolve, reject) => {
    if (!code) return resolve(null);
    db.get(
      `SELECT code, discount_type, value, expires_at, min_amount
       FROM coupons WHERE code = ?`,
      [code],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);

        
        if (row.expires_at) {
          const now = new Date();
          const exp = new Date(row.expires_at);
          if (isNaN(exp.getTime()) || now > exp) return resolve(null);
        }
        
        if (amount < row.min_amount) return resolve(null);

        resolve(row);
      }
    );
  });
}

function quoteShipping(district, items) {
  return new Promise((resolve, reject) => {
    if (!district || !Array.isArray(items) || items.length === 0) {
      return resolve({ cost: 0, totalWeight: 0, base: 0, perKg: 0 });
    }
    db.get(
      'SELECT base_price, price_per_kg FROM shipping_rates WHERE district = ?',
      [district],
      (err, rate) => {
        if (err) return reject(err);
        if (!rate) return resolve({ cost: 0, totalWeight: 0, base: 0, perKg: 0 });

        const ids = items.map(it => it.productId);
        const placeholders = ids.map(() => '?').join(',');
        db.all(
          `SELECT id, weight FROM products WHERE id IN (${placeholders})`,
          ids,
          (err2, prods) => {
            if (err2) return reject(err2);
            const weights = new Map(prods.map(p => [p.id, p.weight]));
            let totalWeight = 0;
            for (const it of items) {
              const w = weights.get(it.productId);
              if (typeof w !== 'number') {
                return reject(new Error(`Producto ${it.productId} no existe`));
              }
              totalWeight += w * Number(it.qty || 0);
            }
            const cost = rate.base_price + rate.price_per_kg * totalWeight;
            resolve({
              cost: Number(cost.toFixed(2)),
              totalWeight,
              base: rate.base_price,
              perKg: rate.price_per_kg
            });
          }
        );
      }
    );
  });
}

function getProductsByIds(ids) {
  return new Promise((resolve, reject) => {
    const placeholders = ids.map(() => '?').join(',');
    db.all(
      `SELECT id, name, price, stock, active FROM products WHERE id IN (${placeholders})`,
      ids,
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}

/**
 * POST /api/orders
 * Body:
 * {
 *   customer: { name, docType, doc, email, phone, address, district, city },
 *   items: [{ productId, qty }],
 *   couponCode?: string
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { customer, items, couponCode } = req.body || {};
    const destLat = customer?.location?.latitude ?? null;
    const destLng = customer?.location?.longitude ?? null;

    if (!customer || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customer e items son requeridos' });
    }
    const { name, docType, doc, email, phone, address, district, city } = customer;
    if (!name || !district) {
      return res.status(400).json({ error: 'name y district son obligatorios' });
    }

    
    const ids = items.map(i => i.productId);
    const prods = await getProductsByIds(ids);
    const byId = new Map(prods.map(p => [p.id, p]));
    for (const it of items) {
      const p = byId.get(it.productId);
      if (!p || !p.active) {
        return res.status(400).json({ error: `Producto ${it.productId} no disponible` });
      }
      if (p.stock <= 0) {
        return res.status(400).json({ error: `Sin stock: ${p.id}` });
      }
      if (Number(it.qty) <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para ${p.id}` });
      }
      
    }

    
    let subtotal = 0;
    const itemsWithPrice = items.map(it => {
      const p = byId.get(it.productId);
      const unit = Number(p.price);
      const line = unit * Number(it.qty);
      subtotal += line;
      return { ...it, unit_price: unit };
    });

    
    let discount_total = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const c = await getCouponIfValid(couponCode, subtotal);
      if (c) {
        if (c.discount_type === 'percent') discount_total = (subtotal * c.value) / 100;
        if (c.discount_type === 'fixed') discount_total = c.value;
        if (discount_total > subtotal) discount_total = subtotal;
        discount_total = Number(discount_total.toFixed(2));
        appliedCoupon = c.code;
      }
    }

    
    const shipping = await quoteShipping(district, items);
    const shipping_cost = shipping.cost;

    
    const total_amount = Number((subtotal - discount_total + shipping_cost).toFixed(2));

    
    await new Promise((resolve, reject) => db.run('BEGIN', (err) => (err ? reject(err) : resolve())));

    const orderId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO orders
    (customer_name, doc_type, customer_doc, email, phone, address, district, city,
     status, subtotal, shipping_cost, discount_total, total_amount,
     dest_lat, dest_lng)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?)`,
        [
          name, docType || null, doc || null, email || null, phone || null, address || null,
          district, city || null,
          subtotal, shipping_cost, discount_total, total_amount,
          destLat, destLng
        ],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    for (const it of itemsWithPrice) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO order_items (order_id, product_id, qty, unit_price)
           VALUES (?, ?, ?, ?)`,
          [orderId, it.productId, Number(it.qty), it.unit_price],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));

    
    res.status(201).json({
      id: orderId,
      status: 'awaiting_payment',
      subtotal,
      shipping_cost,
      discount_total,
      total_amount,
      coupon: appliedCoupon || null
    });
  } catch (err) {
    
    try { await new Promise((resolve) => db.run('ROLLBACK', () => resolve())); } catch { }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders
 * Query: status=activas -> devuelve órdenes listas para operar en almacén (paid|processing)
 */
router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT id, status, created_at, customer_name AS name FROM orders ORDER BY id DESC LIMIT 50`;
  const params = [];

  if (status === 'activas') {
    sql = `SELECT id, status, created_at, customer_name AS name
           FROM orders
           WHERE status IN ('paid','processing')
           ORDER BY id DESC
           LIMIT 50`;
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



/**
 * GET /api/orders/:id
 * Devuelve la orden y sus items
 */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'id inválido' });

  db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    db.all(
      `SELECT oi.id, oi.product_id, p.name, oi.qty, oi.unit_price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id],
      (err2, items) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ order, items });
      }
    );
  });
});



/**
 * POST /api/orders/:id/pay
 * Body: { method: 'mock' | 'card' | 'paypal' | 'yape', result: 'success' | 'failed' }
 * Efectos:
 *  - success: inserta pago, descuenta stock (transacción), order.status = 'paid'
 *  - failed:  inserta pago failed, deja order.status = 'awaiting_payment'
 */
router.post('/:id/pay', async (req, res) => {
  const orderId = Number(req.params.id);
  const { method = 'mock', result = 'success', userId = 1 } = req.body || {}; 
  if (!orderId) return res.status(400).json({ error: 'id inválido' });
  if (!['success', 'failed'].includes(result)) {
    return res.status(400).json({ error: "result debe ser 'success' o 'failed'" });
  }

  try {
    
    const order = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.status !== 'awaiting_payment') {
      return res.status(400).json({ error: `Estado inválido: ${order.status}` });
    }

    
    const items = await new Promise((resolve, reject) => {
      db.all(
        `SELECT oi.product_id, oi.qty, oi.unit_price, p.stock, p.active, p.name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [orderId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    
    await new Promise((resolve, reject) => db.run('BEGIN', (err) => (err ? reject(err) : resolve())));

    
    const paymentId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO payments (order_id, method, status, amount)
         VALUES (?, ?, ?, ?)`,
        [orderId, method, result === 'success' ? 'success' : 'failed', order.total_amount],
        function (err) { if (err) return reject(err); resolve(this.lastID); }
      );
    });

    if (result === 'failed') {
      await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));
      return res.json({ orderId, paymentId, status: 'payment_failed' });
    }

    
    for (const it of items) {
      if (!it.active) {
        await new Promise((resolve) => db.run('ROLLBACK', () => resolve()));
        return res.status(400).json({ error: `Producto ${it.product_id} inactivo` });
      }
      if (it.stock < it.qty) {
        await new Promise((resolve) => db.run('ROLLBACK', () => resolve()));
        return res.status(400).json({ error: `Stock insuficiente para ${it.product_id}` });
      }
    }

    
    for (const it of items) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [it.qty, it.product_id],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    
    await new Promise((resolve, reject) => {
      db.run(`UPDATE orders SET status = 'paid' WHERE id = ?`, [orderId], (err) => (err ? reject(err) : resolve()));
    });

    
    const invoiceId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO invoices (user_id, order_id, total_amount, status)
         VALUES (?, ?, ?, 'paid')`,
        [userId, orderId, order.total_amount],
        function (err) { if (err) return reject(err); resolve(this.lastID); }
      );
    });

    
for (const it of items) {
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO invoice_items (invoice_id, product_id, product_name, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?)`,
      [invoiceId, it.product_id, it.name, it.unit_price, it.qty],
      (err) => (err ? reject(err) : resolve())
    );
  });
}



    
    const assignee = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM employees WHERE active = 1 ORDER BY id ASC LIMIT 1`, [], (err, row) =>
        err ? reject(err) : resolve(row)
      );
    });
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (order_id, assignee_id, type, status) VALUES (?, ?, 'picking', 'pending')`,
        [orderId, assignee ? assignee.id : null],
        (err) => (err ? reject(err) : resolve())
      );
    });

    await new Promise((resolve, reject) => db.run('COMMIT', (err) => (err ? reject(err) : resolve())));

    res.json({
  orderId,               
  paymentId,              
  invoiceId,              
  status: 'paid',        
  invoicePdf: `/facturas/invoice_${invoiceId}.pdf`  
});



  } catch (err) {
    try { await new Promise((resolve) => db.run('ROLLBACK', () => resolve())); } catch {}
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
