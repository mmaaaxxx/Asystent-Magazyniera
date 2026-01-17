
export type OrderStatus = 'UTWORZONE' | 'ZATWIERDZONE';
export type OrderType = 'OST' | 'ZAPAS';

export interface Order {
  id: string | number;
  referencja: string;
  ilosc: number;
  typ: OrderType;
  status: OrderStatus;
  data_utworzenia: string;
  details?: {
    sector?: string;
    mpk?: string;
    notes?: string;
  };
}

export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  totalOST: number;
  totalZapas: number;
}
