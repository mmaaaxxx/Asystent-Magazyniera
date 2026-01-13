
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusSquare, 
  Bell, 
  Settings, 
  Menu, 
  X, 
  ChevronDown, 
  Printer,
  CheckCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Order, DashboardStats, OrderType } from './types';

// --- Components ---

const Badge: React.FC<{ type: string; children: React.ReactNode }> = ({ type, children }) => {
  const styles: Record<string, string> = {
    'OST': 'bg-blue-500 text-white',
    'ZAPAS': 'bg-emerald-500 text-white',
    'Utworzone': 'bg-amber-400 text-white',
    'Wydrukowane': 'bg-blue-500 text-white',
    'Zrobione': 'bg-blue-500 text-white',
  };
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[type] || 'bg-slate-200 text-slate-700'}`}>
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
    <div>
      <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
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
        <div className="bg-slate-800/50 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

const SubmenuItem: React.FC<{ label: string; isActive?: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left pl-11 pr-4 py-2 text-sm transition-colors ${
      isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'list'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarSections, setSidebarSections] = useState({ panel: true, orders: true });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | OrderType>('ALL');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Mock Data
  const [orders] = useState<Order[]>([
    { id: '70620', reference: 'MCB CP MONTAZ', quantity: 1, type: 'OST', status: 'Utworzone', timestamp: '13:10:07 17/12/2025', location: 'M03', user: 'EWA OLEKSYK [00696]', details: { sector: 'A1', mpk: '3242103' }, history: [{ time: '13:10', note: 'Zgłoszenie utworzone przez system.' }] },
    { id: '70619', reference: 'Tampodruk Bieruń', quantity: 12, type: 'ZAPAS', status: 'Utworzone', timestamp: '13:04:11 17/12/2025', location: 'M03', user: 'HUBERT DOMZOŁ [00584]', details: { sector: 'B2', mpk: '3242102' } },
    { id: '70618', reference: 'MCB CP MONTAZ', quantity: 5, type: 'OST', status: 'Wydrukowane', timestamp: '12:36:39 17/12/2025', location: 'M03', user: 'EWA OLEKSYK [00696]' },
    { id: '70617', reference: 'Tampodruk Bieruń', quantity: 20, type: 'ZAPAS', status: 'Wydrukowane', timestamp: '12:06:59 17/12/2025', location: 'M03', user: 'HUBERT DOMZOŁ [00584]' },
    { id: '70616', reference: 'Nawijarki', quantity: 8, type: 'OST', status: 'Wydrukowane', timestamp: '11:49:50 17/12/2025', location: 'M03', user: 'AGNIESZKA KACZMARSKA [00388]' },
    { id: '70615', reference: '4PP Podmontaż 1', quantity: 2, type: 'OST', status: 'Wydrukowane', timestamp: '11:32:26 17/12/2025', location: 'M03', user: 'KLAUDIA GINALSKA [02845]' },
    { id: '70614', reference: 'H3', quantity: 15, type: 'ZAPAS', status: 'Wydrukowane', timestamp: '11:30:22 17/12/2025', location: 'M03', user: 'KLAUDIA GINALSKA [02845]' },
  ]);

  const stats: DashboardStats = {
    todayOrders: 142,
    lastOST: { ref: '70620', qty: 1, time: '13:10' },
    lastZapas: { ref: '70619', qty: 12, time: '13:04' },
    activeReminders: 3
  };

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.reference.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery);
    const matchesType = typeFilter === 'ALL' || o.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex min-h-screen font-sans text-slate-900 bg-slate-50 overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 flex flex-col transition-transform duration-300 transform
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header/Logo */}
        <div className="h-16 flex items-center px-4 bg-slate-900 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-white text-xs mr-3">HAGER</div>
          <span className="text-white font-bold tracking-tight">HPS Kanban</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <SidebarItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Panel" 
            hasSubmenu 
            isOpen={sidebarSections.panel}
            onClick={() => setSidebarSections(s => ({ ...s, panel: !s.panel }))}
          >
            <SubmenuItem label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }} />
          </SidebarItem>

          <SidebarItem 
            icon={<ClipboardList className="w-5 h-5" />} 
            label="Zgłoszenia" 
            hasSubmenu 
            isOpen={sidebarSections.orders}
            onClick={() => setSidebarSections(s => ({ ...s, orders: !s.orders }))}
          >
            <SubmenuItem label="Lista zgłoszeń" isActive={activeView === 'list'} onClick={() => { setActiveView('list'); setMobileMenuOpen(false); }} />
            <SubmenuItem label="Nowe zgłoszenie" onClick={() => setShowNewOrderModal(true)} />
          </SidebarItem>

          <SidebarItem 
            icon={<Bell className="w-5 h-5" />} 
            label="Przypomnienia" 
            onClick={() => {}}
          />

          <SidebarItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Ustawienia" 
            onClick={() => {}}
          />
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">MT</div>
            <div>
              <p className="text-xs text-white font-semibold">Magazyn Tychy</p>
              <p className="text-[10px] text-slate-400">ID: 99999999</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-500" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-slate-800 text-lg hidden sm:block">
              {activeView === 'dashboard' ? 'Asystent Magazyniera' : 'Lista zgłoszeń'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNewOrderModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <PlusSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Nowe zgłoszenie</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
          
          {activeView === 'dashboard' ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Dzisiejsze zgłoszenia</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.todayOrders}</p>
                  <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 rotate-[-45deg]" /> +12% vs wczoraj
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Ostatni OST</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-bold text-slate-900">REF: {stats.lastOST.ref}</p>
                      <p className="text-sm text-slate-500">{stats.lastOST.qty} szt. • {stats.lastOST.time}</p>
                    </div>
                    <Badge type="OST">OST</Badge>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Ostatni ZAPAS</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-lg font-bold text-slate-900">REF: {stats.lastZapas.ref}</p>
                      <p className="text-sm text-slate-500">{stats.lastZapas.qty} szt. • {stats.lastZapas.time}</p>
                    </div>
                    <Badge type="ZAPAS">ZAPAS</Badge>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Aktywne przypomnienia</p>
                  <p className="text-3xl font-bold text-amber-500">{stats.activeReminders}</p>
                  <button className="mt-2 text-xs text-blue-600 font-semibold hover:underline">Zobacz wszystkie</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Table Filters/Search */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Szukaj po referencji lub ID..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    className="border border-slate-200 rounded-lg text-sm p-2 bg-white flex-1 sm:flex-initial"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                  >
                    <option value="ALL">Wszystkie typy</option>
                    <option value="OST">Tylko OST</option>
                    <option value="ZAPAS">Tylko ZAPAS</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3 w-12 text-center">Akcje</th>
                      <th className="px-4 py-3 w-20">ID</th>
                      <th className="px-4 py-3">Referencja</th>
                      <th className="px-4 py-3 w-24">Ilość</th>
                      <th className="px-4 py-3 w-24 text-center">Typ</th>
                      <th className="px-4 py-3 w-32">Status</th>
                      <th className="px-4 py-3">Data / Godzina</th>
                      <th className="px-4 py-3">Lokalizacja</th>
                      <th className="px-4 py-3">Użytkownik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                      <React.Fragment key={order.id}>
                        <tr className={`hover:bg-slate-50 transition-colors group ${expandedRows.has(order.id) ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 justify-center">
                              <button 
                                onClick={() => toggleRow(order.id)}
                                className={`p-1.5 rounded hover:bg-slate-200 transition-transform ${expandedRows.has(order.id) ? 'rotate-180' : ''}`}
                              >
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600">{order.id}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{order.reference}</td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-900">{order.quantity}</td>
                          <td className="px-4 py-4 text-center">
                            <Badge type={order.type}>{order.type}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge type={order.status}>{order.status}</Badge>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500 tabular-nums">{order.timestamp}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{order.location}</td>
                          <td className="px-4 py-4 text-xs text-slate-500 truncate max-w-[150px]">{order.user}</td>
                        </tr>

                        {/* Expandable Content */}
                        {expandedRows.has(order.id) && (
                          <tr className="bg-blue-50/20">
                            <td colSpan={9} className="px-12 py-6 border-l-4 border-blue-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Details Section */}
                                <div>
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Szczegóły</h3>
                                  <dl className="space-y-3">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                      <dt className="text-sm text-slate-500">Sektor:</dt>
                                      <dd className="text-sm font-bold text-slate-900">{order.details?.sector || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                      <dt className="text-sm text-slate-500">Numer MPK:</dt>
                                      <dd className="text-sm font-bold text-slate-900">{order.details?.mpk || '—'}</dd>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                      <dt className="text-sm text-slate-500">Referencja:</dt>
                                      <dd className="text-sm font-bold text-slate-900">{order.reference}</dd>
                                    </div>
                                  </dl>
                                </div>

                                {/* History / Notes */}
                                <div className="lg:col-span-2">
                                  <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historia / Notatki</h3>
                                    <button className="text-[10px] text-blue-600 font-bold hover:underline">DODAJ NOTATKĘ</button>
                                  </div>
                                  <div className="space-y-4">
                                    {order.history?.map((entry, idx) => (
                                      <div key={idx} className="flex gap-4">
                                        <div className="shrink-0 w-16 text-[10px] font-bold text-slate-400 mt-1">{entry.time}</div>
                                        <div className="relative pb-4">
                                          {idx !== (order.history?.length || 0) - 1 && (
                                            <div className="absolute left-[-9px] top-2 bottom-0 w-[1px] bg-slate-200"></div>
                                          )}
                                          <div className="absolute left-[-13px] top-1.5 w-2 h-2 rounded-full bg-blue-500"></div>
                                          <p className="text-sm text-slate-700">{entry.note}</p>
                                        </div>
                                      </div>
                                    )) || (
                                      <p className="text-sm text-slate-400 italic">Brak dodatkowej historii.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Row Actions */}
                              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-2">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm">
                                  <Printer className="w-3 h-3" /> DRUKUJ ETYKIETĘ
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" /> OZNACZ JAKO ZROBIONE
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
                                  <Edit className="w-3 h-3 text-blue-500" /> EDYTUJ
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-red-600 text-xs font-bold hover:bg-red-50">
                                  <Trash2 className="w-3 h-3" /> USUŃ
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-20 text-center text-slate-400">
                          Brak zgłoszeń pasujących do filtrów.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Mockup */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>Wyświetlanie 1 - {filteredOrders.length} z {filteredOrders.length} zgłoszeń</div>
                <div className="flex gap-1">
                  <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50" disabled>1</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Order Modal (Simplified Mockup) */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNewOrderModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Nowe zgłoszenie</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Referencja</label>
                <input type="text" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Np. Tampodruk Bieruń" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ilość</label>
                  <input type="number" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" defaultValue={1} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Typ</label>
                  <select className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option>OST</option>
                    <option>ZAPAS</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800">Anuluj</button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 active:scale-95 transition-all">Utwórz zgłoszenie</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
