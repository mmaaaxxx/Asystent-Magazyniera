import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
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
  
  // Naming aligned with user snippet: zgloszenia
  const [zgloszenia, setZgloszenia] = useState<Order[]>([]);
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

  // API: Fetch Orders using Axios and handling flat array with optional .json wrapping
  const fetchZgloszenia = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      console.log('Rozpoczynam pobieranie...');
      const response = await axios.get(API_URLS.GET_ORDERS);
      console.log('Otrzymane dane:', response.data);
      
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else {
        console.warn('Nieznany format danych, ustawiam puste.');
        rawData = [];
      }

      // Safe unwrapping for n8n standard format: item.json || item
      const mappedData = rawData.map((item: any) => item.json || item);
      setZgloszenia(mappedData);

    } catch (error: any) {
      console.error('Błąd połączenia:', error);
      setApiError('Błąd pobierania danych. Sprawdź połączenie z n8n.');
      setZgloszenia([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZgloszenia();
  }, []);

  // API Actions
  const handleZatwierdz = async (id: string | number) => {
    setProcessingId(id.toString());
    try {
      const response = await fetch(API_URLS.APPROVE_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        setZgloszenia(prev => (prev || []).map(o => o.id === id ? { ...o, status: 'ZATWIERDZONE' as any } : o));
        setToast({ message: 'Zatwierdzono zgłoszenie!', type: 'success' });
      }
    } catch (error) {
      console.error('Approve error:', error);
    } finally {
      setProcessingId(null);
    }
  };

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
        setZgloszenia(prev => (prev || []).filter(o => o.id !== id));
        setToast({ message: 'Usunięto zgłoszenie!', type: 'success' });
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setProcessingId(null);
    }
  };

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
        setToast({ message: 'Dodano zgłoszenie!', type: 'success' });
        await fetchZgloszenia(); 
        setShowNewOrderModal(false); 
        setNewOrderForm({ referencja: '', ilosc: 1, typ: 'OST' }); 
      }
    } catch (error) {
      console.error('Add error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const stats = useMemo(() => {
    const list = zgloszenia || [];
    const totalOst = list.filter(o => o.typ === 'OST').reduce((acc, curr) => acc + (Number(curr.ilosc) || 0), 0);
    const totalZapas = list.filter(o => o.typ === 'ZAPAS').reduce((acc, curr) => acc + (Number(curr.ilosc) || 0), 0);
    
    return {
      todayOrders: list.length,
      pendingOrders: list.filter(o => o.status === 'UTWORZONE').length,
      totalOST: totalOst,
      totalZapas: totalZapas
    };
  }, [zgloszenia]);

  const filteredOrders = useMemo(() => {
    return (zgloszenia || []).filter(o => {
      const matchesSearch = (o.referencja?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.id?.toString() || '').includes(searchQuery);
      const matchesType = typeFilter === 'ALL' || o.typ === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [zgloszenia, searchQuery, typeFilter]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      
      {mobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transition-transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="h-8 px-2 bg-orange-600 rounded flex items-center justify-center font-black text-white text-[11px] mr-3 uppercase">HAGER</div>
          <div className="flex flex-col text-white font-bold"><span>Asystent</span><span className="text-slate-400 text-xs">Magazyniera</span></div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-2">
          <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={<ClipboardList className="w-5 h-5" />} label="Zgłoszenia" hasSubmenu isOpen={sidebarSections.orders} onClick={() => setSidebarSections(s => ({ ...s, orders: !s.orders }))}>
            <SubmenuItem label="Lista zgłoszeń" isActive={activeView === 'list'} onClick={() => { setActiveView('list'); setMobileMenuOpen(false); }} />
            <SubmenuItem label="Archiwum" isActive={activeView === 'archive'} onClick={() => { setActiveView('archive'); setMobileMenuOpen(false); }} />
            <SubmenuItem label="Nowe zgłoszenie" onClick={() => { setShowNewOrderModal(true); setMobileMenuOpen(false); }} />
          </SidebarItem>
          <SidebarItem icon={<Bell className="w-5 h-5" />} label="Przypomnienia" isActive={activeView === 'reminders'} onClick={() => setActiveView('reminders')} />
          <SidebarItem icon={<Settings className="w-5 h-5" />} label="Ustawienia" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">{activeView === 'dashboard' ? 'Pulpit' : 'Zgłoszenia'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchZgloszenia} className="p-2 text-slate-400 hover:text-blue-600">
              <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowNewOrderModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
              <PlusSquare className="w-4 h-4" /> Nowe
            </button>
          </div>
        </header>

        {apiError && (
          <div className="bg-red-600 text-white px-6 py-2 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {apiError}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {activeView === 'dashboard' ? (
            <div className="animate-in fade-in duration-500 space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Wszystkie', val: stats.todayOrders, color: 'blue' },
                  { label: 'Utworzone', val: stats.pendingOrders, color: 'amber' },
                  { label: 'Suma OST', val: stats.totalOST, color: 'blue' },
                  { label: 'Suma Zapas', val: stats.totalZapas, color: 'indigo' },
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-1">{s.label}</p>
                    <p className="text-xl font-black">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="p-4 border-b border-slate-200 font-bold text-sm">Ostatnie rekordy</div>
                {(zgloszenia || []).slice(0, 5).map(o => (
                  <div key={o.id} className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 transition-colors">
                    <div className="font-bold">{o.referencja}</div>
                    <Badge type={o.status || 'UTWORZONE'}>{o.status || 'UTWORZONE'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" placeholder="Szukaj..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold"
                  value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
                >
                  <option value="ALL">WSZYSTKIE</option>
                  <option value="OST">OST</option>
                  <option value="ZAPAS">ZAPAS</option>
                </select>
              </div>

              <div className="space-y-3">
                {(filteredOrders || []).length === 0 && !isLoading ? (
                  <div className="text-center py-20 text-slate-400 text-sm">Brak danych.</div>
                ) : (
                  (filteredOrders || [])
                    .sort((a, b) => Number(b.id) - Number(a.id))
                    .map((o) => (
                      <div key={o.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleRow(o.id.toString())}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs ${o.typ === 'OST' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                              {o.typ}
                            </div>
                            <div>
                              <div className="font-black text-sm">{o.referencja}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{o.id} • {o.ilosc} SZT.</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge type={o.status || 'UTWORZONE'}>{o.status || 'UTWORZONE'}</Badge>
                            <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${expandedRows.has(o.id.toString()) ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        {expandedRows.has(o.id.toString()) && (
                          <div className="px-4 pb-4 pt-2 border-t border-slate-50 flex justify-between items-center gap-2">
                            <div className="text-[10px] text-slate-400 font-bold">{formatDate(o.data_utworzenia)}</div>
                            <div className="flex gap-2">
                              <button 
                                disabled={o.status === 'ZATWIERDZONE' || processingId === o.id.toString()}
                                onClick={() => handleZatwierdz(o.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black disabled:opacity-50"
                              >ZATWIERDŹ</button>
                              <button 
                                disabled={processingId === o.id.toString()}
                                onClick={() => handleKasuj(o.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black"
                              >KASUJ</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-sm uppercase">Nowe Zgłoszenie</h3>
            <form onSubmit={handleAddNewOrder} className="space-y-4">
              <input 
                type="text" required autoFocus placeholder="REFERENCJA (np. 2M3390)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase"
                value={newOrderForm.referencja} onChange={e => setNewOrderForm(f => ({ ...f, referencja: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" required min="1" placeholder="ILOŚĆ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  value={newOrderForm.ilosc} onChange={e => setNewOrderForm(f => ({ ...f, ilosc: parseInt(e.target.value) || 1 }))}
                />
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  value={newOrderForm.typ} onChange={e => setNewOrderForm(f => ({ ...f, typ: e.target.value as any }))}
                >
                  <option value="OST">OST</option>
                  <option value="ZAPAS">ZAPAS</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-500">ANULUJ</button>
                <button type="submit" disabled={isAdding} className="flex-[2] bg-blue-600 text-white py-3 px-6 rounded-xl text-xs font-black">
                  {isAdding ? 'DODAWANIE...' : 'DODAJ ZGŁOSZENIE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-8">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;