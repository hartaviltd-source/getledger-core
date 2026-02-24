const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_PATH = process.env.DB_PATH || './database.sqlite';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:", "cdn.tailwindcss.com", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "ui-avatars.com"],
      fontSrc: ["'self'", "https:", "cdnjs.cloudflare.com", "fonts.gstatic.com"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create directories
const publicDir = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.static(publicDir));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
  console.log('SQLite connected');
  initDatabase();
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      type TEXT CHECK(type IN ('sales', 'purchase')) NOT NULL,
      contact_name TEXT NOT NULL,
      contact_id INTEGER,
      date TEXT NOT NULL,
      due_date TEXT,
      total REAL NOT NULL,
      status TEXT CHECK(status IN ('paid', 'pending', 'overdue', 'draft')) DEFAULT 'pending',
      items TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('customer', 'supplier')) NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_number TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Default admin
    const adminEmail = 'admin@getledgercore.pro';
    db.get("SELECT id FROM users WHERE email = ?", [adminEmail], (err, row) => {
      if (!row) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (email, password, company_name) VALUES (?, ?, ?)", 
          [adminEmail, hash, 'GetLedger Core Ltd.']);
        console.log('Admin created: admin@getledgercore.pro / admin123');
      }
    });
  });
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, user.password).then(valid => {
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, company_name: user.company_name } });
    });
  });
});

app.get('/api/invoices', authenticateToken, (req, res) => {
  const { status } = req.query;
  let sql = "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC";
  let params = [req.user.id];
  if (status) {
    sql = "SELECT * FROM invoices WHERE user_id = ? AND status = ? ORDER BY created_at DESC";
    params.push(status);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({ ...row, items: JSON.parse(row.items) })));
  });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  const { invoice_number, type, contact_name, date, due_date, total, status, items, notes } = req.body;
  db.run(`INSERT INTO invoices 
    (user_id, invoice_number, type, contact_name, date, due_date, total, status, items, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, invoice_number, type, contact_name, date, due_date, total, status, JSON.stringify(items), notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Invoice created' });
    });
});

app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM invoices WHERE id = ? AND user_id = ?", 
    [req.params.id, req.user.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Invoice deleted' });
    });
});

app.get('/api/contacts', authenticateToken, (req, res) => {
  db.all("SELECT * FROM contacts WHERE user_id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/contacts', authenticateToken, (req, res) => {
  const { name, type, phone, email } = req.body;
  db.run(`INSERT INTO contacts (user_id, name, type, phone, email) VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, name, type, phone, email],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

const upload = multer({ dest: 'uploads/' });

app.post('/api/import', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const workbook = xlsx.readFile(req.file.path);
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let imported = 0;
    data.forEach(row => {
      db.run(`INSERT INTO invoices 
        (user_id, invoice_number, type, contact_name, date, due_date, total, status, items) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, 
         row['Fatura No'] || `IMP-${Date.now()}`, 
         'sales',
         row['Müşteri'] || row['contact'] || 'Unknown',
         row['Tarih'] || row['date'] || new Date().toISOString().split('T')[0],
         row['Vade'] || new Date().toISOString().split('T')[0],
         parseFloat(row['Toplam'] || row['Tutar'] || 0),
         'pending',
         JSON.stringify([{desc: 'Imported', qty: 1, price: parseFloat(row['Toplam'] || 0)}])]
      );
      imported++;
    });
    fs.unlinkSync(req.file.path);
    res.json({ imported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/export', authenticateToken, (req, res) => {
  const { type } = req.query;
  if (type === 'all') {
    db.all("SELECT * FROM invoices WHERE user_id = ?", [req.user.id], (err, invoices) => {
      if (err) return res.status(500).json({ error: err.message });
      invoices.forEach(inv => inv.items = JSON.parse(inv.items));
      db.all("SELECT * FROM contacts WHERE user_id = ?", [req.user.id], (err, contacts) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
        res.send(JSON.stringify({ invoices, contacts }, null, 2));
      });
    });
  } else {
    db.all(`SELECT * FROM ${type} WHERE user_id = ?`, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (type === 'invoices') rows.forEach(r => r.items = JSON.parse(r.items));
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Data');
      const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}.xlsx`);
      res.send(buf);
    });
  }
});

app.get('/api/stats', authenticateToken, (req, res) => {
  db.get(`SELECT 
    COALESCE(SUM(CASE WHEN type = 'sales' AND status = 'paid' THEN total ELSE 0 END), 0) as income,
    COALESCE(SUM(CASE WHEN type = 'purchase' AND status = 'paid' THEN total ELSE 0 END), 0) as expense,
    COUNT(CASE WHEN status IN ('pending', 'overdue') THEN 1 END) as pending_count
    FROM invoices WHERE user_id = ?`, [req.user.id], (err, stats) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense,
      pending_count: stats.pending_count
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GetLedger Core running on http://0.0.0.0:${PORT}`);
});
