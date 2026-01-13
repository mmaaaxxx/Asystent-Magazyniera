
import React, { useState, useMemo } from 'react';
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
  Box
} from 'lucide-react';
import { Order, DashboardStats, OrderType } from './types';

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
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'reminders' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarSections, setSidebarSections] = useState({ panel: true, orders: true });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | OrderType>('ALL');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Mock Data
  const [orders, setOrders] = useState<Order[]>([
    { id: '10250', reference: '0B1227', quantity: 24, type: 'OST', status: 'UTWORZONE', timestamp: '14:22:10 18/05/2024' },
    { id: '10249', reference: '2M3390', quantity: 150, type: 'ZAPAS', status: 'UTWORZONE', timestamp: '14:15:05 18/05/2024' },
    { id: '10248', reference: 'XG9912', quantity: 8, type: 'OST', status: 'ZATWIERDZONE', timestamp: '13:50:44 18/05/2024' },
    { id: '10247', reference: '0B1227', quantity: 48, type: 'OST', status: 'ZATWIERDZONE', timestamp: '13:12:00 18/05/2024' },
    { id: '10246', reference: 'RR4421', quantity: 500, type: 'ZAPAS', status: 'ZATWIERDZONE', timestamp: '12:45:30 18/05/2024' },
    { id: '10245', reference: '2M3390', quantity: 75, type: 'ZAPAS', status: 'UTWORZONE', timestamp: '12:10:15 18/05/2024' },
  ]);

  const stats: DashboardStats = useMemo(() => ({
    todayOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'UTWORZONE').length,
    lastOST: { ref: '0B1227', qty: 24, time: '14:22' },
    lastZapas: { ref: '2M3390', qty: 150, time: '14:15' }
  }), [orders]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const handleZatwierdz = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ZATWIERDZONE' } : o));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.reference.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery);
      const matchesType = typeFilter === 'ALL' || o.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [orders, searchQuery, typeFilter]);

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
                 activeView === 'reminders' ? 'Przypomnienia' : 'Ustawienia'}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
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

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 scroll-smooth">
          
          {activeView === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Wszystkie Dziś', val: stats.todayOrders, sub: 'Suma zleceń', color: 'blue' },
                  { label: 'Oczekujące', val: stats.pendingOrders, sub: 'Status: Utworzone', color: 'amber' },
                  { label: 'Ostatni OST', val: stats.lastOST.ref, sub: `${stats.lastOST.qty} szt. • ${stats.lastOST.time}`, color: 'blue' },
                  { label: 'Ostatni Zapas', val: stats.lastZapas.ref, sub: `${stats.lastZapas.qty} szt. • ${stats.lastZapas.time}`, color: 'indigo' },
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
                    <div key={o.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveView('list'); toggleRow(o.id); }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${o.type === 'OST' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {o.type}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{o.reference}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{o.id} • {o.timestamp.split(' ')[0]}</p>
                        </div>
                      </div>
                      <Badge type={o.status}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'list' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-full space-y-4">
              {/* Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Szukaj referencji (np. 0B1227)..." 
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

              {/* Data Display - Responsive Container */}
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
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Data / Godzina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((o) => (
                        <React.Fragment key={o.id}>
                          <tr className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${expandedRows.has(o.id) ? 'bg-blue-50/50' : ''}`} onClick={() => toggleRow(o.id)}>
                            <td className="px-4 py-4">
                              <div className={`p-1 rounded-md transition-transform ${expandedRows.has(o.id) ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-500">{o.id}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900">{o.reference}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-800">{o.quantity}</td>
                            <td className="px-6 py-4">
                              <Badge type={o.type}>{o.type}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge type={o.status}>{o.status}</Badge>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400 text-right tabular-nums">{o.timestamp}</td>
                          </tr>
                          
                          {/* Desktop Expandable Content */}
                          {expandedRows.has(o.id) && (
                            <tr className="bg-blue-50/30">
                              <td colSpan={7} className="px-16 py-8 border-l-4 border-blue-600 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="grid grid-cols-3 gap-12">
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kluczowe Parametry</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Referencja produktu:</span>
                                        <span className="text-xs font-black">{o.reference}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Ilość zamówiona:</span>
                                        <span className="text-xs font-black">{o.quantity} szt.</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Typ zlecenia:</span>
                                        <span className="text-xs font-black">{o.type}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informacje Czasowe</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Data rejestracji:</span>
                                        <span className="text-xs font-black">{o.timestamp.split(' ')[1]}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span className="text-xs text-slate-500 font-medium">Czas utworzenia:</span>
                                        <span className="text-xs font-black">{o.timestamp.split(' ')[0]}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Obsługa</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {o.status === 'UTWORZONE' ? (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleZatwierdz(o.id); }}
                                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" /> ZATWIERDŹ
                                        </button>
                                      ) : (
                                        <div className="w-full flex items-center justify-center py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                                          ZLECENIE ZATWIERDZONE
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium">Brak wyników dla podanych kryteriów.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card List View */}
                <div className="lg:hidden space-y-4">
                  {filteredOrders.map((o) => (
                    <div key={o.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${expandedRows.has(o.id) ? 'ring-2 ring-blue-500/20' : ''}`}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleRow(o.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${o.type === 'OST' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {o.type}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate">{o.reference}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{o.id} • {o.quantity} SZT.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge type={o.status}>{o.status === 'UTWORZONE' ? 'UTW' : 'ZATW'}</Badge>
                          <div className={`transition-transform duration-300 ${expandedRows.has(o.id) ? 'rotate-180 text-blue-600' : 'text-slate-300'}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {expandedRows.has(o.id) && (
                        <div className="px-5 pb-5 pt-1 space-y-6 animate-in slide-in-from-top-2">
                          <div className="h-[1px] bg-slate-100"></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Rejestracji</p>
                              <p className="text-xs font-bold text-slate-800">{o.timestamp}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Typ Zlecenia</p>
                              <p className="text-xs font-bold text-slate-800">{o.type}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {o.status === 'UTWORZONE' ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleZatwierdz(o.id); }}
                                className="w-full bg-emerald-600 text-white h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                              >
                                <CheckCircle className="w-4 h-4" /> ZATWIERDŹ
                              </button>
                            ) : (
                                <div className="w-full flex items-center justify-center h-12 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100 uppercase">
                                  Zatwierdzono
                                </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="py-20 text-center text-slate-400 text-sm font-medium">Brak wyników.</div>
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
                      <span className="text-slate-900">Dziś, 14:30:11</span>
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
            
            <form className="p-6 space-y-6" onSubmit={(e) => { e.preventDefault(); setShowNewOrderModal(false); }}>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Referencja Produktu</label>
                <div className="relative group">
                  <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500" />
                  <input 
                    type="text" 
                    autoFocus
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="1" 
                    defaultValue={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Typ</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                    <option value="OST">OST</option>
                    <option value="ZAPAS">ZAPAS</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="flex-1 px-4 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">ANULUJ</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">UTWÓRZ ZGŁOSZENIE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
