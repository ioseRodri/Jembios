
const { Router } = require('express');
const bcrypt = require('bcrypt');        
const db = require('../db/connect');

const router = Router();

/**
 * POST /api/auth/register
 * Body: { nombre, correo, password, rol? }  
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, password, rol = 'Cliente', telefono = null } = req.body || {};
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Faltan campos (nombre, correo, password)' });
    }

    const hash = await bcrypt.hash(password, 10);

    
    db.get('SELECT id_rol FROM roles WHERE nombre_rol = ?', [rol], (err, role) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!role) return res.status(400).json({ error: 'Rol inválido' });

      
      const sql = `
        INSERT INTO usuarios(nombre, correo, telefono, password, id_rol, estado)
        VALUES (?, ?, ?, ?, ?, 'activo')
      `;
      db.run(sql, [nombre, correo, telefono, hash, role.id_rol], function (err2) {
        if (err2) {
          if (err2.message && err2.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Correo ya registrado' });
          }
          return res.status(500).json({ error: err2.message });
        }
        res.json({ ok: true, id_usuario: this.lastID, rol });
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/auth/login
 * Body: { correo, password }
 * Respuesta simple (sin JWT): { ok, usuario: { id, nombre, rol } }
 */
router.post('/login', (req, res) => {
  const { correo, password } = req.body || {};
  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  const sql = `
    SELECT u.id_usuario, u.nombre, u.password, r.nombre_rol AS rol
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.correo = ? AND u.estado = 'activo'
  `;
  db.get(sql, [correo], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    
    res.json({
      ok: true,
      usuario: { id: user.id_usuario, nombre: user.nombre, rol: user.rol }
    });
  });
});

module.exports = router;
