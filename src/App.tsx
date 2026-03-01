import React, { useState, useEffect } from 'react';
import { Plus, Home, Bolt, Wifi, CreditCard, Droplets, ArrowLeft, TrendingUp, CheckCircle2, ReceiptText, LayoutGrid, BarChart3, Settings2, Trash2, Check, RotateCcw, X, Calendar, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { Bill, BillStatus, HistoryItem } from './types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Aluguel': <Home className="size-6" />,
  'Energia': <Bolt className="size-6" />,
  'Internet': <Wifi className="size-6" />,
  'Cartão': <CreditCard className="size-6" />,
  'Água': <Droplets className="size-6" />,
  'Outros': <ReceiptText className="size-6" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Aluguel': 'bg-orange-100 text-orange-600',
  'Energia': 'bg-blue-100 text-blue-600',
  'Internet': 'bg-purple-100 text-purple-600',
  'Cartão': 'bg-red-100 text-red-600',
  'Água': 'bg-slate-100 text-slate-600',
  'Outros': 'bg-emerald-100 text-emerald-600',
};

const STATUS_STYLES: Record<BillStatus, string> = {
  'Pendente': 'text-orange-600 bg-orange-50',
  'Agendado': 'text-slate-400 bg-slate-100',
  'Pago': 'text-emerald-600 bg-emerald-50',
  'Atrasado': 'text-red-600 bg-red-50',
};

export default function App() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'history'>('list');
  const [filter, setFilter] = useState<'Todas' | 'Pendentes' | 'Pagas'>('Todas');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentDay, setPaymentDay] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    notes: '',
    category: 'Outros'
  });

  useEffect(() => {
    fetchBills();
    fetchHistory();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBill = {
      ...formData,
      amount: parseFloat(formData.amount),
      dueDate: parseInt(formData.dueDate),
      status: 'Pendente' as BillStatus,
    };

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBill),
      });
      if (res.ok) {
        fetchBills();
        setView('list');
        setFormData({ name: '', amount: '', dueDate: '', notes: '', category: 'Outros' });
      }
    } catch (err) {
      console.error('Error saving bill:', err);
    }
  };

  const toggleStatus = async (bill: Bill) => {
    if (bill.status === 'Pago') {
      // If already paid, toggle back to pending
      try {
        await fetch(`/api/bills/${bill.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Pendente', paidAt: null }),
        });
        fetchBills();
      } catch (err) {
        console.error('Error updating status:', err);
      }
    } else {
      // Open modal to confirm payment
      setSelectedBill(bill);
      setPaymentDay(new Date().getDate().toString());
    }
  };

  const confirmPayment = async () => {
    if (!selectedBill) return;
    try {
      const res = await fetch(`/api/bills/${selectedBill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Pago', 
          paidAt: paymentDay 
        }),
      });
      if (res.ok) {
        await fetchBills();
        await fetchHistory();
        setSelectedBill(null);
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
    }
  };

  const deleteBill = async (id: number) => {
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      fetchBills();
    } catch (err) {
      console.error('Error deleting bill:', err);
    }
  };

  const handleReset = async () => {
    console.log('Reset button clicked!');
    try {
      const res = await fetch('/api/bills/reset', { method: 'POST' });
      if (res.ok) {
        console.log('Reset successful, fetching bills...');
        await fetchBills();
      }
    } catch (err) {
      console.error('Error resetting bills:', err);
    }
  };

  const filteredBills = bills.filter(b => {
    if (filter === 'Todas') return true;
    if (filter === 'Pendentes') return b.status !== 'Pago';
    if (filter === 'Pagas') return b.status === 'Pago';
    return true;
  });

  const totalPendente = bills
    .filter(b => b.status !== 'Pago')
    .reduce((acc, b) => acc + b.amount, 0);

  const totalPago = bills
    .filter(b => b.status === 'Pago')
    .reduce((acc, b) => acc + b.amount, 0);

  const paidCount = bills.filter(b => b.status === 'Pago').length;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-200 dark:border-slate-800 justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ReceiptText className="size-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Pay Mind - Contas</h1>
              </div>
              <button className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent('marcioat@gmail.com')}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
              </button>
            </header>

            {/* Summary Cards */}
            <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar">
              <div className="flex min-w-[160px] flex-1 flex-col gap-2 rounded-xl p-4 bg-primary text-white shadow-lg shadow-primary/20">
                <p className="text-primary-100 text-sm font-medium opacity-90">Total Pendente</p>
                <p className="text-2xl font-bold tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold bg-white/20 w-fit px-2 py-0.5 rounded-full">
                  <TrendingUp className="size-3" />
                  <span>12%</span>
                </div>
              </div>
              <div className="flex min-w-[160px] flex-1 flex-col gap-2 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pago</p>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
                </p>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  <span>{paidCount} contas</span>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 px-4 pb-2 items-center">
              {(['Todas', 'Pendentes', 'Pagas'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
                    filter === f 
                      ? "bg-primary text-white" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {f}
                </button>
              ))}
              <button 
                onClick={handleReset}
                className="ml-auto bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Resetar</span>
              </button>
            </div>

            {/* Bill List */}
            <main className="flex-1 px-4 py-2 space-y-3 mb-24">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Nenhuma conta encontrada.</div>
              ) : (
                filteredBills.map((bill) => (
                  <motion.div
                    layout
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => toggleStatus(bill)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all active:scale-[0.98]",
                      bill.status === 'Pago' ? "bg-[#e8f5e9] dark:bg-emerald-900/20" : "bg-white dark:bg-slate-900"
                    )}
                  >
                    <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", CATEGORY_COLORS[bill.category] || 'bg-slate-100 text-slate-600')}>
                      {CATEGORY_ICONS[bill.category] || <ReceiptText className="size-6" />}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between items-start">
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">{bill.name}</p>
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {bill.status === 'Pago' ? `Pago Dia ${bill.paidAt}` : `Dia ${bill.dueDate}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded", STATUS_STYLES[bill.status])}>
                            {bill.status}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBill(bill.id);
                            }} 
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </main>

            {/* Payment Confirmation Modal */}
            <AnimatePresence>
              {selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-primary/10 overflow-hidden"
                  >
                    {/* Modal Header */}
                    <div className="p-6 text-center border-b border-primary/5 relative">
                      <button 
                        onClick={() => setSelectedBill(null)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="size-5" />
                      </button>
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <ReceiptText className="text-primary size-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedBill.name}</h3>
                      <p className="text-primary font-bold text-2xl mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBill.amount)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        Vencimento: Dia {selectedBill.dueDate}
                      </p>
                    </div>
                    {/* Modal Body / Form */}
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="due-day">
                          Dia do Pagamento
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                          <input
                            autoFocus
                            className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-slate-900 dark:text-slate-100 outline-none transition-all"
                            id="due-day"
                            max="31"
                            min="1"
                            placeholder="Ex: 10"
                            type="number"
                            value={paymentDay}
                            onChange={(e) => setPaymentDay(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={confirmPayment}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="size-5" />
                          Gravar Alterações
                        </button>
                        <button
                          onClick={() => setSelectedBill(null)}
                          className="w-full mt-2 bg-transparent text-slate-500 dark:text-slate-400 font-medium py-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <button 
              onClick={() => setView('form')}
              className="fixed bottom-24 right-6 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/40 active:scale-95 transition-transform z-20"
            >
              <Plus className="size-8" />
            </button>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pb-6 pt-3">
              <button 
                onClick={() => setView('list')}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1", view === 'list' ? "text-primary" : "text-slate-400")}
              >
                <LayoutGrid className="size-6" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Contas</p>
              </button>
              <button 
                onClick={() => setView('history')}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1", view === 'history' ? "text-primary" : "text-slate-400")}
              >
                <ReceiptText className="size-6" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Histórico</p>
              </button>
            </nav>
          </motion.div>
        ) : view === 'history' ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-200 dark:border-slate-800 justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ReceiptText className="size-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Pay Mind - Histórico</h1>
              </div>
            </header>

            {/* History List */}
            <main className="flex-1 px-4 py-4 space-y-4 mb-24 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Nenhum histórico de pagamento.</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-lg", CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-600')}>
                      {CATEGORY_ICONS[item.category] || <ReceiptText className="size-6" />}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between items-start">
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pago Dia {item.paidAt}</p>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {item.paymentMonth}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pb-6 pt-3">
              <button 
                onClick={() => setView('list')}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1", view === 'list' ? "text-primary" : "text-slate-400")}
              >
                <LayoutGrid className="size-6" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Contas</p>
              </button>
              <button 
                onClick={() => setView('history')}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1", view === 'history' ? "text-primary" : "text-slate-400")}
              >
                <ReceiptText className="size-6" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Histórico</p>
              </button>
            </nav>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-full min-h-screen"
          >
            {/* Header */}
            <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setView('list')}
                className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="size-6" />
              </button>
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 ml-2">Nova Conta</h2>
              <div className="size-12 shrink-0"></div>
            </header>

            <main className="flex-1 overflow-y-auto">
              <form onSubmit={handleSave} className="max-w-[480px] mx-auto w-full flex flex-col gap-6 p-4">
                {/* Account Name Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal" htmlFor="account-name">
                    Nome da Conta
                  </label>
                  <input
                    required
                    className="flex w-full rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base font-normal leading-normal transition-all"
                    id="account-name"
                    placeholder="Ex: Aluguel"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                {/* Category Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal">
                    Categoria
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(CATEGORY_ICONS).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({...formData, category: cat})}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                          formData.category === cat 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-slate-200 dark:border-slate-800 text-slate-500"
                        )}
                      >
                        {CATEGORY_ICONS[cat]}
                        <span className="text-xs font-semibold">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal" htmlFor="amount">
                    Valor
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-500 dark:text-slate-400 font-medium">R$</span>
                    <input
                      required
                      className="flex w-full rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-4 text-base font-normal leading-normal transition-all"
                      id="amount"
                      placeholder="0,00"
                      step="0.01"
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>

                {/* Due Date Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal" htmlFor="due-date">
                    Dia do Vencimento
                  </label>
                  <input
                    required
                    className="flex w-full rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base font-normal leading-normal transition-all"
                    id="due-date"
                    max="31"
                    min="1"
                    placeholder="Ex: 15"
                    type="number"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>

                {/* Description (Optional) */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal" htmlFor="notes">
                    Observações (Opcional)
                  </label>
                  <textarea
                    className="flex w-full rounded-lg text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 text-base font-normal leading-normal transition-all"
                    id="notes"
                    placeholder="Adicione uma nota..."
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] mt-4 mb-10"
                >
                  Salvar
                </button>
              </form>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
