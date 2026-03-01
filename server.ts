import Database from 'better-sqlite3';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer as createViteServer } from 'vite';

const db = new Database('bills.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    dueDate INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    category TEXT NOT NULL,
    paidAt TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billId INTEGER,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    paidAt TEXT NOT NULL,
    paymentMonth TEXT NOT NULL
  )
`);

// Seed initial data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM bills').get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO bills (name, amount, dueDate, status, category) VALUES (?, ?, ?, ?, ?)');
  insert.run('Aluguel', 1500.00, 10, 'Pendente', 'Aluguel');
  insert.run('Energia Elétrica', 245.50, 15, 'Agendado', 'Energia');
  insert.run('Internet & TV', 189.90, 18, 'Pago', 'Internet');
  insert.run('Cartão de Crédito', 3200.00, 5, 'Atrasado', 'Cartão');
  insert.run('Água', 85.20, 25, 'Pago', 'Água');
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = 3000;

// API Routes
app.get('/api/bills', (req, res) => {
  const bills = db.prepare('SELECT * FROM bills ORDER BY dueDate ASC').all();
  res.json(bills);
});

app.post('/api/bills', (req, res) => {
  const { name, amount, dueDate, status, notes, category } = req.body;
  const result = db.prepare(
    'INSERT INTO bills (name, amount, dueDate, status, notes, category) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, amount, dueDate, status, notes, category);
  
  const newBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newBill);
});

app.patch('/api/bills/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  db.prepare(`UPDATE bills SET ${fields} WHERE id = ?`).run(...values, id);
  
  // If marked as paid, record in history
  if (updates.status === 'Pago' && updates.paidAt) {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as any;
    const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    db.prepare(`
      INSERT INTO history (billId, name, amount, category, paidAt, paymentMonth)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(bill.id, bill.name, bill.amount, bill.category, updates.paidAt, currentMonth);
  }

  const updatedBill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
  res.json(updatedBill);
});

app.get('/api/history', (req, res) => {
  const history = db.prepare('SELECT * FROM history ORDER BY id DESC').all();
  res.json(history);
});

app.delete('/api/bills/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM bills WHERE id = ?').run(id);
  res.status(204).send();
});

app.post('/api/bills/reset', (req, res) => {
  console.log('Resetting all bills...');
  try {
    const result = db.prepare("UPDATE bills SET status = 'Pendente', paidAt = NULL").run();
    console.log(`Reset successful. Rows affected: ${result.changes}`);
    res.json({ message: 'Bills reset successfully', changes: result.changes });
  } catch (err) {
    console.error('Error resetting bills in DB:', err);
    res.status(500).json({ error: 'Failed to reset bills' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
