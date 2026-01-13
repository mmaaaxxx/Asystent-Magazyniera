
export type OrderStatus = 'UTWORZONE' | 'ZATWIERDZONE';
export type OrderType = 'OST' | 'ZAPAS';

export interface Order {
  id: string;
  reference: string;
  quantity: number;
  type: OrderType;
  status: OrderStatus;
  timestamp: string;
  details?: {
    sector?: string;
    mpk?: string;
    notes?: string;
  };
}

export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  lastOST: { ref: string; qty: number; time: string };
  lastZapas: { ref: string; qty: number; time: string };
}
