import { Bill, HistoryItem } from '../types';
import { Capacitor } from '@capacitor/core';
// import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

// This service is ready for Capacitor SQLite.
// Currently, it uses localStorage for the web preview.
// When you run it as an APK, you can uncomment the SQLite logic below.

const BILLS_KEY = 'paymind_bills';
const HISTORY_KEY = 'paymind_history';

const initialBills: Bill[] = [
  { id: 1, name: 'Aluguel', amount: 1500.00, dueDate: 10, status: 'Pendente', category: 'Aluguel' },
  { id: 2, name: 'Energia Elétrica', amount: 245.50, dueDate: 15, status: 'Agendado', category: 'Energia' },
  { id: 3, name: 'Internet & TV', amount: 189.90, dueDate: 18, status: 'Pago', category: 'Internet' },
  { id: 4, name: 'Cartão de Crédito', amount: 3200.00, dueDate: 5, status: 'Atrasado', category: 'Cartão' },
  { id: 5, name: 'Água', amount: 85.20, dueDate: 25, status: 'Pago', category: 'Água' },
];

const isNative = Capacitor.isNativePlatform();

export const dbService = {
  // --- LOCAL STORAGE FALLBACK (For Web/Preview) ---
  getBills: (): Bill[] => {
    const data = localStorage.getItem(BILLS_KEY);
    if (!data) {
      localStorage.setItem(BILLS_KEY, JSON.stringify(initialBills));
      return initialBills;
    }
    return JSON.parse(data);
  },

  saveBill: (bill: Omit<Bill, 'id'>): Bill => {
    const bills = dbService.getBills();
    const newBill = { ...bill, id: Date.now() } as Bill;
    const updatedBills = [...bills, newBill];
    localStorage.setItem(BILLS_KEY, JSON.stringify(updatedBills));
    return newBill;
  },

  updateBill: (id: number, updates: Partial<Bill>): Bill | null => {
    const bills = dbService.getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index === -1) return null;

    const updatedBill = { ...bills[index], ...updates };
    
    if (updates.status === 'Pago' && updates.paidAt) {
      const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      dbService.addHistory({
        billId: id,
        name: updatedBill.name,
        amount: updatedBill.amount,
        category: updatedBill.category,
        paidAt: updates.paidAt,
        paymentMonth: currentMonth
      });
    }

    bills[index] = updatedBill;
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    return updatedBill;
  },

  deleteBill: (id: number): void => {
    const bills = dbService.getBills();
    const updatedBills = bills.filter(b => b.id !== id);
    localStorage.setItem(BILLS_KEY, JSON.stringify(updatedBills));
  },

  resetBills: (): void => {
    const bills = dbService.getBills();
    const updatedBills = bills.map(b => ({ ...b, status: 'Pendente' as const, paidAt: undefined }));
    localStorage.setItem(BILLS_KEY, JSON.stringify(updatedBills));
  },

  getHistory: (): HistoryItem[] => {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  },

  addHistory: (item: Omit<HistoryItem, 'id'>): HistoryItem => {
    const history = dbService.getHistory();
    const newItem = { ...item, id: Date.now() } as HistoryItem;
    const updatedHistory = [newItem, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return newItem;
  }

  // --- SQLITE IMPLEMENTATION (Uncomment and implement when ready for APK) ---
  /*
  async initSQLite() {
    if (!isNative) return;
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection('paymind_db', false, 'no-encryption', 1, false);
    await db.open();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        amount REAL,
        dueDate INTEGER,
        status TEXT,
        category TEXT,
        paidAt TEXT
      );
    `);
    // ... implement other methods using db.query() and db.run()
  }
  */
};
