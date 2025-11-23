-- ORDERS (si no existen)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  doc_type TEXT,                 -- "DNI" | "RUC" | NULL
  customer_doc TEXT,             -- número de doc
  email TEXT,
  phone TEXT,
  address TEXT,
  district TEXT NOT NULL,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  subtotal REAL NOT NULL DEFAULT 0,
  shipping_cost REAL NOT NULL DEFAULT 0,
  discount_total REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ORDER ITEMS (si no existen)
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

-- Al final de tu script de inicialización:

-- FACTURAS / PAGOS REALIZADOS
CREATE TABLE IF NOT EXISTS invoices (
  id_invoice INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES usuarios(id_usuario),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id_item INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(invoice_id) REFERENCES invoices(id_invoice) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES productos(id_producto)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
