
export type OrderStatus = 'Utworzone' | 'Wydrukowane' | 'Zrobione' | 'Błąd';
export type OrderType = 'OST' | 'ZAPAS';

export interface Order {
  id: string;
  reference: string;
  quantity: number;
  type: OrderType;
  status: OrderStatus;
  timestamp: string;
  location: string;
  user: string;
  details?: {
    sector: string;
    mpk: string;
    items?: string[];
  };
  history?: {
    time: string;
    note: string;
  }[];
}

export interface DashboardStats {
  todayOrders: number;
  lastOST: { ref: string; qty: number; time: string };
  lastZapas: { ref: string; qty: number; time: string };
  activeReminders: number;
}
