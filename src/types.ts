import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDate: number;
  status: 'Pendente' | 'Agendado' | 'Pago' | 'Atrasado';
  notes?: string;
  category: string;
  paidAt?: string;
}

export interface HistoryItem {
  id: number;
  billId: number;
  name: string;
  amount: number;
  category: string;
  paidAt: string;
  paymentMonth: string;
}

export type BillStatus = Bill['status'];
