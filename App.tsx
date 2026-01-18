
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusSquare, 
  Bell, 
  Settings, 
  Menu, 
  X, 
  ChevronDown, 
  CheckCircle, 
  Search, 
  Calendar, 
  Box,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Order, DashboardStats, OrderType } from './types';

// --- API Endpoints ---
const API_URLS = {
  GET_ORDERS: 'https://n8n.maxcore.dev/webhook/pobierz-zgloszenia',
  APPROVE_ORDER: 'https://n8n.maxcore.dev/webhook/zatwierdz-zgloszenie',
  DELETE_ORDER: 'https://n8n.maxcore.dev/webhook/kasuj-zgloszenie',
  ADD_ORDER: 'https://n8n.maxcore.dev/webhook/dodaj-zgloszenie'
};

// --- Components ---

const Badge: React.FC<{ type: string; children: React.ReactNode }> = ({ type, children }) => {
  const styles: Record<string, string> = {
    'OST': 'bg-blue-100 text-blue-700 border-blue-200',
    'ZAPAS': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'UTWORZONE': 'bg-amber-100 text-amber-700 border-amber-200',
    'ZATWIERDZONE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${styles[type] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {children}
    </span>
  );
};

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean; 
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}> = ({ icon, label, isActive, hasSubmenu, isOpen, onClick, children }) => {
  return (
    <div className="mb-1">
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all rounded-lg mx-2 ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }`}
        style={{ width: 'calc(100% - 1rem)' }}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {hasSubmenu && (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
      {isOpen && children && (
        <div className="mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const SubmenuItem: React.FC<{ label: string; isActive?: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left pl-12 pr-4 py-2 text-sm transition-colors rounded-lg mx-2 ${
      isActive ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-slate-500 hover:text-white'
    }`}
    style={{ width: 'calc(100% - 1.5rem)' }}
  >
    {label}
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'archive' | 'reminders' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarSections, setSidebarSections] = useState({ panel: true, orders: true });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | OrderType>('ALL');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [newOrderForm, setNewOrderForm] = useState({
    referencja: '',
    ilosc: 1,
    typ: 'OST' as OrderType
  });

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // API: Fetch Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch(API_URLS.GET_ORDERS);
      
      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`);
      }

      const rawResponse = await response.json();
      console.log('SUROWE DANE Z SERWERA:', rawResponse);

      // Super Pancerny Parser
      let rawArray: any[] = [];
      if (rawResponse && rawResponse.data && Array.isArray(rawResponse.data)) {
        rawArray = rawResponse.data;
      } else if (Array.isArray(rawResponse)) {
        rawArray = rawResponse;
      } else if (rawResponse && typeof rawResponse === 'object') {
        rawArray = [rawResponse];
      }

      const mappedData = rawArray
        .map((o: any) => ({
          ...o,
          ilosc: Number(o.ilosc) || 0
        }))
        .sort((a, b) => Number(b.id) - Number(a.id)); // Sortowanie: wyższe ID na górze
      
      setOrders(mappedData);
    } catch (error: any) {
      console.error('Błąd pobierania orders:', error);
      setApiError(error.message || 'Błąd połączenia.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // API: Approve Order
  const handleZatwierdz = async (id: string | number) => {
    setProcessingId(id.toString());
    try {
      const response = await fetch(API_URLS.APPROVE_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ZATWIERDZONE' } : o));
      }
    } catch (error) {
      console.error('Error approving order:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // API: Delete Order
  const handleKasuj = async (id: string | number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;
    
    setProcessingId(id.toString());
    try {
      const response = await fetch(API_URLS.DELETE_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        const nextExpanded = new Set(expandedRows);
        nextExpanded.delete(id.toString());
        setExpandedRows(nextExpanded);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // API: Add New Order
  const handleAddNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.referencja.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch(API_URLS.ADD_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencja: newOrderForm.referencja.toUpperCase(),
          ilosc: Number(newOrderForm.ilosc),
          typ: newOrderForm.typ
        })
      });

      if (response.ok) {
        setToast({ message: 'Zgłoszenie dodane!', type: 'success' });
        await fetchOrders(); 
        setActiveView('list'); 
        setShowNewOrderModal(false); 
        setNewOrderForm({ referencja: '', ilosc: 1, typ: 'OST' }); 
      } else {
        setToast({ message: 'Błąd podczas dodawania.', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding order:', error);
      setToast({ message: 'Błąd sieci.', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const totalOst = orders.filter(o => o.typ === 'OST').reduce((acc, curr) => acc + curr.ilosc, 0);
    const totalZapas = orders.filter(o => o.typ === 'ZAPAS').reduce((acc, curr) => acc + curr.ilosc, 0);
    
    return {
      todayOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'UTWORZONE').length,
      totalOST: totalOst,
      totalZapas: totalZapas
    };
  }, [orders]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = (o.referencja?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.id?.toString() || '').includes(searchQuery);
      const matchesType = typeFilter === 'ALL' || o.typ === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [orders, searchQuery, typeFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pl-PL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 flex flex-col transition-all duration-300 ease-in-out transform
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Branding */}
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-slate-800">
          <div className="h-8 px-2 bg-orange-600 rounded flex items-center justify-center font-black text-white text-[11px] tracking-tight shadow-lg shadow-orange-600/20 mr-3 uppercase">HAGER</div>
          <div className="flex flex-col">
            <span className="text-white font-bold leading-tight tracking-tight">Asystent</span>
            <span className="text-slate-400 text-xs font-medium">Magazyniera</span>
          </div>
        </div>

        {/* Nav Container */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            isActive={activeView === 'dashboard'}
            onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
          />

          <SidebarItem 
            icon={<ClipboardList className="w-5 h-5" />} 
            label="Zgłoszenia" 
            hasSubmenu 
            isOpen={sidebarSections.orders}
            onClick={() => setSidebarSections(s => ({ ...s, orders: !s.orders }))}
          >
            <SubmenuItem 
              label="Lista zgłoszeń" 
              isActive={activeView === 'list'} 
              onClick={() => { setActiveView('list'); setMobileMenuOpen(false); }} 
            />
            <SubmenuItem 
              label="Archiwum" 
              isActive={activeView === 'archive'} 
              onClick={() => { setActiveView('archive'); setMobileMenuOpen(false); }} 
            />
            <SubmenuItem 
              label="Nowe zgłoszenie" 
              onClick={() => { setShowNewOrderModal(true); setMobileMenuOpen(false); }} 
            />
          </SidebarItem>

          <SidebarItem 
            icon={<Bell className="w-5 h-5" />} 
            label="Przypomnienia" 
            isActive={activeView === 'reminders'}
            onClick={() => { setActiveView('reminders'); setMobileMenuOpen(false); }}
          />

          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Ustawienia" 
            isActive={activeView === 'settings'}
            onClick={() => { setActiveView('settings'); setMobileMenuOpen(false); }}
          />
        </nav>
      </aside>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-bold text-slate-800 text-base sm:text-lg">
                {activeView === 'dashboard' ? 'Pulpit Sterowniczy' : 
                 activeView === 'list' ? 'Lista Zgłoszeń' :
                 activeView === 'archive' ? 'Archiwum' :
                 activeView === 'reminders' ? 'Przypomnienia' : 'Ustawienia'}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchOrders}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Odśwież dane"
            >
              <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            <button 
              onClick={() => setShowNewOrderModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <PlusSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Nowe Zgłoszenie</span>
            </button>
          </div>
        </header>

        {/* API Error Banner */}
        {apiError && (
          <div className="bg-red-600 text-white px-6 py-3 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <AlertCircle className="w-5 h-5" />
            <span>BŁĄD POŁĄCZENIA: {apiError}</span>
            <button onClick={fetchOrders} className="ml-auto underline hover:no-underline font-black">PONÓW PRÓBĘ</button>
          </div>
        )}

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 scroll-smooth">
          
          {isLoading && activeView !== 'dashboard' ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
               <p className="text-sm font-medium">Pobieranie zgłoszeń...</p>
            </div>
          ) : activeView === 'dashboard' ? (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Wszystkie Rekordy', val: stats.todayOrders, sub: 'Liczba w bazie', color: 'blue' },
                  { label: 'Status: Utworzone', val: stats.pendingOrders, sub: 'Do realizacji', color: 'amber' },
                  { label: 'Suma OST', val: stats.totalOST, sub: 'Całkowita ilość', color: 'blue' },
                  { label: 'Suma Zapas', val: stats.totalZapas, sub: 'Całkowita ilość', color: 'indigo' },
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                      <div className={`p-2 rounded-lg bg-${s.color}-50 text-${s.color}-600`}>
                        <Box className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-1">{s.val}</p>
                    <p className="text-xs text-slate-400 font-medium">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions / Recent Orders Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Ostatnie Aktywności
                  </h2>
                  <button onClick={() => setActiveView('list')} className="text-xs font-bold text-blue-600 hover:underline">Zobacz listę</button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {orders.slice(0, 4).map((o) => (
                    <div key={o.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveView('list'); toggleRow(o.id.toString()); }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${o.typ === 'OST' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {o.typ}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{o.referencja}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{o.id} • {formatDate(o.data_utworzenia)}</p>
                        </div>
                      </div>
                      <Badge type={o.status}>{o.status}</Badge>
                    </div>
                  ))}
                  {orders.length === 0 && !isLoading && !apiError && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Brak danych w bazie.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (activeView === 'list' || activeView === 'archive') && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-full space-y-4">
              
              {/* Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Szukaj referencji lub ID..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    {['ALL', 'OST', 'ZAPAS'].map((type) => (
                      <button 
                        key={type}
                        onClick={() => setTypeFilter(type as any)}
                        className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          typeFilter === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {type === 'ALL' ? 'WSZYSTKIE' : type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Display */}
              <div className="flex-1 min-h-0">
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="px-4 py-4 w-12 text-center"></th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Referencja</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ilość</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Typ</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Data Utworzenia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((o) => (
                        <React.Fragment key={o.id}>
                          <tr className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${expandedRows.has(o.id.toString()) ? 'bg-blue-50/50' : ''}`} onClick={() => toggleRow(o.id.toString())}>
                            <td className="px-4 py-4">
                              <div className={`p-1 rounded-md transition-transform ${expandedRows.has(o.id.toString()) ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-500">{o.id}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900">{o.referencja}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-800">{o.ilosc}</td>
                            <td className="px-6 py-4">
                              <Badge type={o.typ}>{o.typ}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge type={o.status}>{o.status}</Badge>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400 text-right tabular-nums">{formatDate(o.data_utworzenia)}</td>
                          </tr>
                          
                          {/* Desktop Expandable Content */}
                          {expandedRows.has(o.id.toString()) && (
                            <tr className="bg-blue-50/30">
                              <td colSpan={7} className="px-16 py-8 border-l-4 border-blue-600 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="grid grid-cols-3 gap-12">
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kluczowe Parametry</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Referencja produktu:</span>
                                        <span className="text-xs font-black">{o.referencja}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Ilość zamówiona:</span>
                                        <span className="text-xs font-black">{o.ilosc} szt.</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Typ zlecenia:</span>
                                        <span className="text-xs font-black">{o.typ}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informacje Czasowe</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Data rejestracji:</span>
                                        <span className="text-xs font-black">{formatDate(o.data_utworzenia)}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Status systemowy:</span>
                                        <span className="text-xs font-black uppercase tracking-widest">{o.status}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obsługa</h4>
                                    <div className="flex flex-col gap-3">
                                      <div className="flex gap-2">
                                        <button 
                                          disabled={o.status === 'ZATWIERDZONE' || processingId === o.id.toString()}
                                          onClick={(e) => { e.stopPropagation(); handleZatwierdz(o.id); }}
                                          className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                                            o.status === 'ZATWIERDZONE' 
                                              ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-default'
                                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                                          }`}
                                        >
                                          {processingId === o.id.toString() ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} 
                                          {o.status === 'ZATWIERDZONE' ? 'ZATWIERDZONO' : 'ZATWIERDŹ'}
                                        </button>
                                        
                                        <button 
                                          disabled={processingId === o.id.toString()}
                                          onClick={(e) => { e.stopPropagation(); handleKasuj(o.id); }}
                                          className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-95 transition-all"
                                        >
                                          {processingId === o.id.toString() ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} 
                                          KASUJ
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {filteredOrders.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium">Brak zgłoszeń do wyświetlenia.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card List View */}
                <div className="lg:hidden space-y-4">
                  {filteredOrders.map((o) => (
                    <div key={o.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${expandedRows.has(o.id.toString()) ? 'ring-2 ring-blue-500/20' : ''}`}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleRow(o.id.toString())}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${o.typ === 'OST' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {o.typ}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{o.referencja}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{o.id} • {o.ilosc} SZT.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge type={o.status}>{o.status === 'UTWORZONE' ? 'UTW' : 'ZATW'}</Badge>
                          <div className={`transition-transform duration-300 ${expandedRows.has(o.id.toString()) ? 'rotate-180 text-blue-600' : 'text-slate-300'}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {expandedRows.has(o.id.toString()) && (
                        <div className="px-5 pb-5 pt-1 space-y-6 animate-in slide-in-from-top-2">
                          <div className="h-[1px] bg-slate-100"></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Utworzenia</p>
                              <p className="text-xs font-bold text-slate-800">{formatDate(o.data_utworzenia)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Typ Zlecenia</p>
                              <p className="text-xs font-bold text-slate-800">{o.typ}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              disabled={o.status === 'ZATWIERDZONE' || processingId === o.id.toString()}
                              onClick={(e) => { e.stopPropagation(); handleZatwierdz(o.id); }}
                              className={`flex-1 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 ${
                                o.status === 'ZATWIERDZONE' 
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {processingId === o.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} 
                              {o.status === 'ZATWIERDZONE' ? 'ZATWIERDZONO' : 'ZATWIERDŹ'}
                            </button>
                            <button 
                              disabled={processingId === o.id.toString()}
                              onClick={(e) => { e.stopPropagation(); handleKasuj(o.id); }}
                              className="flex-1 bg-red-600 text-white h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                            >
                              {processingId === o.id.toString() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                              KASUJ
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredOrders.length === 0 && !isLoading && (
                    <div className="py-20 text-center text-slate-400 text-sm font-medium">Brak zgłoszeń.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'reminders' && (
            <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                <Bell className="w-10 h-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black text-slate-800">Brak aktywnych powiadomień</h3>
                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">System nie wykrył żadnych pilnych przypomnień w Twojej strefie.</p>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="animate-in slide-in-from-right-4 duration-500 max-w-2xl space-y-8">
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Informacje o Systemie</h2>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                      <span>Wersja Oprogramowania</span>
                      <span className="text-slate-900">v2.4.12-release</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                      <span>Ostatnia Synchronizacja</span>
                      <span className="text-slate-900">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Środowisko</span>
                      <span className="text-slate-900">PRODUKCJA (PL-TYCHY)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowNewOrderModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Nowe Zgłoszenie</h3>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form className="p-6 space-y-6" onSubmit={handleAddNewOrder}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Referencja Produktu</label>
                <div className="relative group">
                  <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={newOrderForm.referencja}
                    onChange={(e) => setNewOrderForm(f => ({ ...f, referencja: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:normal-case" 
                    placeholder="Np. 2M3390" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Ilość (SZT.)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newOrderForm.ilosc}
                    onChange={(e) => setNewOrderForm(f => ({ ...f, ilosc: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="1" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Typ</label>
                  <select 
                    value={newOrderForm.typ}
                    onChange={(e) => setNewOrderForm(f => ({ ...f, typ: e.target.value as OrderType }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="OST">OST</option>
                    <option value="ZAPAS">ZAPAS</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewOrderModal(false)} 
                  className="flex-1 px-4 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ANULUJ
                </button>
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="flex-[2] bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                  UTWÓRZ ZGŁOSZENIE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-8 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-red-600 text-white border-red-500'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
