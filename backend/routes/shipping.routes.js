const { Router } = require('express');
const db = require('../db/connect');
const { getDistance } = require('geolib'); 
const router = Router();

/**
 * Origen Jembios (aprox. Carabayllo).
 * Si quieres afinarlo, puedes geocodificar la dirección exacta.
 */
const ORIGIN = { latitude: -11.9523, longitude: -77.0394 };

/**
 * POST /api/shipping/quote
 * Body OPCIÓN A (por DISTRICT):
 *    { district: string, items: [{ productId, qty }] }
 *    costo = base_price + (price_per_kg * peso_total)
 *
 * Body OPCIÓN B (por LOCATION - MAPA):
 *    { location: { latitude, longitude }, items: [{ productId, qty }] }
 *    costo = base (S/5) + perKm (S/1.5) * distancia_km
 */
router.post('/quote', (req, res) => {
  const { district, location, items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items es requerido y no puede estar vacío' });
  }

  
  if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
    
    const ids = items.map(it => it.productId);
    const placeholders = ids.map(() => '?').join(',');
    db.all(`SELECT id, weight FROM products WHERE id IN (${placeholders})`, ids, (err2, prods) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const weights = new Map(prods.map(p => [p.id, p.weight]));
      let totalWeight = 0;
      for (const it of items) {
        const w = weights.get(it.productId);
        if (typeof w !== 'number') {
          return res.status(400).json({ error: `Producto ${it.productId} no existe` });
        }
        totalWeight += w * Number(it.qty || 0);
      }

      const distMeters = getDistance(ORIGIN, { latitude: location.latitude, longitude: location.longitude });
      const distKm = distMeters / 1000;

      
      const base = 5;    
      const perKm = 1.5; 
      const cost = Number((base + perKm * distKm).toFixed(2));

      return res.json({
        mode: 'distance',
        distanceKm: Number(distKm.toFixed(2)),
        base,
        perKm,
        totalWeight: Number(totalWeight.toFixed(2)),
        cost
      });
    });
    return;
  }

  
  if (!district) {
    return res.status(400).json({ error: 'district o location son requeridos' });
  }

  db.get(
    'SELECT base_price, price_per_kg FROM shipping_rates WHERE district = ?',
    [district],
    (err, rate) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rate) return res.status(404).json({ error: 'No hay tarifa para ese distrito' });

      const ids = items.map(it => it.productId);
      const placeholders = ids.map(() => '?').join(',');
      db.all(
        `SELECT id, weight FROM products WHERE id IN (${placeholders})`,
        ids,
        (err2, prods) => {
          if (err2) return res.status(500).json({ error: err2.message });

          const weights = new Map(prods.map(p => [p.id, p.weight]));
          let totalWeight = 0;
          for (const it of items) {
            const w = weights.get(it.productId);
            if (typeof w !== 'number') {
              return res.status(400).json({ error: `Producto ${it.productId} no existe` });
            }
            totalWeight += w * Number(it.qty || 0);
          }

          const cost = rate.base_price + rate.price_per_kg * totalWeight;
          res.json({
            mode: 'district',
            district,
            totalWeight: Number(totalWeight.toFixed(2)),
            base: rate.base_price,
            perKg: rate.price_per_kg,
            cost: Number(cost.toFixed(2))
          });
        }
      );
    }
  );
});

module.exports = router;
