import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  AlertCircle,
  Info,
  Hammer,
  ScanBarcode,
  Zap,
  ZapOff,
  ZoomIn,
  Camera
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Order, OrderType } from './types';

// --- API Endpoints ---
const API_URLS = {
  GET_ORDERS: 'https://n8n.maxcore.dev/webhook/pobierz-zgloszenia',
  APPROVE_ORDER: 'https://n8n.maxcore.dev/webhook/zatwierdz-zgloszenie',
  DELETE_ORDER: 'https://n8n.maxcore.dev/webhook/kasuj-zgloszenie',
  ADD_ORDER: 'https://n8n.maxcore.dev/webhook/dodaj-zgloszenie',
  OCR_ANALYZE: 'https://n8n.maxcore.dev/webhook/ocr-analiza'
};

// --- Components ---

const BarcodeScanner: React.FC<{ 
  onScan: (text: string) => void; 
  onClose: () => void;
  onError: (msg: string) => void;
}> = ({ onScan, onClose, onError }) => {
  const [zoom, setZoom] = useState(1);
  const [zoomCap, setZoomCap] = useState<{min: number, max: number} | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Unique ID for the reader instance to avoid conflicts
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    // 'Safe Mode' configuration for maximum compatibility
    const config = { 
      fps: 10, // Reduced FPS to give CPU more time to process each frame (Quality > Speed)
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        // Increased scanning area (85% of screen) for easier targeting
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.floor(minEdge * 0.85);
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
      // Removed formatsToSupport to allow all barcode types for maximum compatibility
      videoConstraints: {
        facingMode: "environment",
        focusMode: "continuous",
        width: { ideal: 1280 }, 
        height: { ideal: 720 }
      },
      experimentalFeatures: {
        // Disabled native engine for broader compatibility as requested
        useBarCodeDetectorIfSupported: false
      },
      rememberLastUsedCamera: true
    };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config as any,
      (decodedText) => {
        if (navigator.vibrate) navigator.vibrate(200);
        // Stop and clear before returning result
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            onScan(decodedText);
          }).catch(err => {
            console.warn("Stop failed", err);
            onScan(decodedText); // Still return text even if stop fails
          });
        }
      },
      () => {
        // Frame processing errors ignored
      }
    )
    .then(() => {
      // Key: Access capabilities ONLY after camera has successfully started
      try {
        const caps = html5QrCode.getRunningTrackCameraCapabilities();
        
        // Zoom check
        if (caps.zoomFeature().isSupported()) {
          setZoomCap({
            min: caps.zoomFeature().min(),
            max: caps.zoomFeature().max()
          });
          setZoom(caps.zoomFeature().min());
        }

        // Torch check
        if (caps.torchFeature().isSupported()) {
          setHasTorch(true);
        }
      } catch (e) {
        console.log("Capabilities not supported or API error", e);
      }
    })
    .catch(err => {
      console.error("Błąd startu kamery:", err);
      // Avoid reporting error if it's just a common cleanup race condition
      if (!err.toString().includes("interrupted by the media being removed")) {
        onError("Błąd kamery: Brak uprawnień lub urządzenie w użyciu.");
      }
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.warn("Cleanup stop error", err));
      }
      try {
        html5QrCode.clear();
      } catch (e) {
        // Ignore clear errors during unmount
      }
    };
  }, [onScan, onError]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    setZoom(newZoom);
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: newZoom }]
      } as any).catch(err => {
        console.warn("Failed to apply zoom", err);
      });
    }
  };

  const handleTorchToggle = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    try {
      const newState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }]
      } as any);
      setIsTorchOn(newState);
    } catch (err) {
      console.error("Failed to toggle torch", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-3xl border-2 border-white/10 shadow-2xl bg-black">
        <div id="reader" className="w-full h-full rounded-2xl"></div>
        
        {/* Targeting overlay based on config (dynamic 85%) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          <div className="w-[85%] h-[85%] border-2 border-blue-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative flex items-center justify-center">
             <div className="absolute w-full h-[2px] bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_2s_infinite_ease-in-out]"></div>
             
             {/* Corner brackets */}
             <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
             <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
             <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
             <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
          </div>
        </div>

        {/* Torch Button */}
        {hasTorch && (
          <button 
            onClick={handleTorchToggle}
            className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all z-10 ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white border border-white/20'}`}
          >
            {isTorchOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>
        )}
      </div>
      
      {/* Zoom Control */}
      {zoomCap && (
        <div className="w-full max-w-sm px-4 mt-8 flex flex-col gap-3">
          <div className="flex justify-between text-slate-400 text-[10px] font-bold mb-1 uppercase tracking-widest">
              <span>Oddal</span>
              <span className="text-white flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom ({zoom.toFixed(1)}x)</span>
              <span>Przybliż</span>
          </div>
          <input 
            type="range" 
            min={zoomCap.min} 
            max={zoomCap.max} 
            step="0.1" 
            value={zoom}
            onChange={handleZoomChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-6 w-full max-w-xs">
        <div className="text-white text-center space-y-2">
          <h2 className="font-black text-lg tracking-tight uppercase">Skanowanie...</h2>
          <p className="text-[11px] text-white/50 leading-relaxed px-4 italic">
            Jeśli kod jest mały, użyj suwaka powyżej. Skaner rozpoznaje <span className="text-blue-400 font-bold">Wszystkie rodzaje kodów</span>.
          </p>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" /> Anuluj
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-110px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110px); opacity: 0; }
        }
        #reader video {
          object-fit: cover !important;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
};

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
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  
  const [zgloszenia, setZgloszenia] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [newOrderForm, setNewOrderForm] = useState({
    referencja: '',
    ilosc: 1,
    typ: 'OST' as OrderType
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchZgloszenia = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await axios.get(API_URLS.GET_ORDERS);
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else {
        rawData = [];
      }
      const mappedData = rawData.map((item: any) => item.json || item);
      setZgloszenia(mappedData);
    } catch (error: any) {
      setApiError('Błąd pobierania danych.');
      setZgloszenia([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZgloszenia();
  }, [activeView]);

  const stats = useMemo(() => {
    const list = zgloszenia || [];
    const pending = list.filter(o => o.status !== 'ZATWIERDZONE');
    const archived = list.filter(o => o.status === 'ZATWIERDZONE');
    return {
      total: list.length,
      pending: pending.length,
      archive: archived.length
    };
  }, [zgloszenia]);

  const handleZatwierdz = async (id: string | number) => {
    setProcessingId(id.toString());
    try {
      const response = await axios.post(API_URLS.APPROVE_ORDER, { id: Number(id) });
      if (response.status >= 200 && response.status < 300) {
        setToast({ message: 'Zatwierdzono i zarchiwizowano zgłoszenie!', type: 'success' });
        await fetchZgloszenia();
      }
    } catch (error) {
      console.error('Approve error:', error);
      setToast({ message: 'Błąd podczas zatwierdzania.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleKasuj = async (id: string | number) => {
    console.log('Próba usunięcia ID:', id);
    setProcessingId(id.toString());
    try {
      const response = await axios.post(API_URLS.DELETE_ORDER, { id: Number(id) });
      if (response.status >= 200 && response.status < 300) {
        setToast({ message: 'Zgłoszenie zostało usunięte z bazy danych.', type: 'success' });
        await fetchZgloszenia();
        setExpandedRows(new Set());
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'Błąd podczas usuwania z bazy.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.referencja.trim()) return;
    setIsAdding(true);
    const finalQuantity = newOrderForm.typ === 'ZAPAS' ? 0 : Number(newOrderForm.ilosc);
    try {
      const response = await axios.post(API_URLS.ADD_ORDER, {
        referencja: newOrderForm.referencja.toUpperCase(),
        ilosc: finalQuantity,
        typ: newOrderForm.typ
      });
      if (response.status >= 200 && response.status < 300) {
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

  const handleAIPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingAI(true);
    const formData = new FormData();
    formData.append('data', file);

    try {
      const response = await axios.post(API_URLS.OCR_ANALYZE, formData);
      // Correct extraction logic for both array and object formats from n8n
      const result = Array.isArray(response.data) ? response.data[0]?.text : response.data?.text;

      if (result && result !== 'BRAK') {
        const cleanCode = result.toUpperCase().trim();
        setNewOrderForm(f => ({ ...f, referencja: cleanCode }));
        setToast({ message: `AI odczytało kod: ${cleanCode}`, type: 'success' });
      } else {
        setToast({ message: 'AI nie rozpoznało tekstu.', type: 'error' });
      }
    } catch (error) {
      console.error('OCR analysis failed:', error);
      setToast({ message: 'Błąd podczas analizy AI.', type: 'error' });
    } finally {
      setIsAnalyzingAI(false);
      if (e.target) e.target.value = ''; // Reset input to allow selecting same file
    }
  };

  const filteredOrders = useMemo(() => {
    const list = zgloszenia || [];
    const isArchiveView = activeView === 'archive';
    
    return list.filter(o => {
      const matchesSearch = (o.referencja?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (o.id?.toString() || '').includes(searchQuery);
      
      const statusMatch = isArchiveView 
        ? o.status === 'ZATWIERDZONE'
        : (o.status !== 'ZATWIERDZONE');

      return matchesSearch && statusMatch;
    });
  }, [zgloszenia, searchQuery, activeView]);

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

  const handleScanSuccess = (code: string) => {
    const cleanCode = code.toUpperCase();
    setNewOrderForm(f => ({ ...f, referencja: cleanCode }));
    setShowScanner(false);
    setToast({ message: `Zeskanowano kod: ${cleanCode}`, type: 'success' });
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
          <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }} />
          <SidebarItem icon={<ClipboardList className="w-5 h-5" />} label="Zgłoszenia" hasSubmenu isOpen={sidebarSections.orders} onClick={() => setSidebarSections(s => ({ ...s, orders: !s.orders }))}>
            <SubmenuItem label="Lista zgłoszeń" isActive={activeView === 'list'} onClick={() => { setActiveView('list'); setMobileMenuOpen(false); }} />
            <SubmenuItem label="Archiwum" isActive={activeView === 'archive'} onClick={() => { setActiveView('archive'); setMobileMenuOpen(false); }} />
            <SubmenuItem label="Nowe zgłoszenie" onClick={() => { setShowNewOrderModal(true); setMobileMenuOpen(false); }} />
          </SidebarItem>
          <SidebarItem icon={<Bell className="w-5 h-5" />} label="Przypomnienia" isActive={activeView === 'reminders'} onClick={() => { setActiveView('reminders'); setMobileMenuOpen(false); }} />
          <SidebarItem icon={<Settings className="w-5 h-5" />} label="Ustawienia" isActive={activeView === 'settings'} onClick={() => { setActiveView('settings'); setMobileMenuOpen(false); }} />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} className="min-h-[4rem] h-auto bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(true)}><Menu className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">
              {activeView === 'dashboard' ? 'Pulpit' : 
               activeView === 'list' ? 'Lista zgłoszeń' : 
               activeView === 'archive' ? 'Archiwum' : 
               activeView === 'reminders' ? 'Przypomnienia' : 
               'Ustawienia'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchZgloszenia()} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Odśwież dane">
              <Loader2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setActiveView('list')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Zgłoszenia">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => setShowNewOrderModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors ml-1">
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
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setActiveView('list')}>
                <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-wider">Wszystkie zgłoszenia</p>
                <p className="text-xl font-black">{stats.total}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setActiveView('list')}>
                <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-wider">Niepotwierdzone</p>
                <p className="text-xl font-black">{stats.pending}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setActiveView('archive')}>
                <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-wider">Archiwum</p>
                <p className="text-xl font-black">{stats.archive}</p>
              </div>
            </div>
          )}

          {(activeView === 'dashboard' || activeView === 'list' || activeView === 'archive') && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" placeholder="Szukaj referencji lub ID..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {(filteredOrders || []).length === 0 && !isLoading ? (
                  <div className="text-center py-20 text-slate-400 text-sm italic">Brak zgłoszeń do wyświetlenia.</div>
                ) : (
                  (filteredOrders || [])
                    .sort((a, b) => Number(b.id) - Number(a.id))
                    .map((o) => (
                      <div key={o.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                          <div className="px-4 pb-4 pt-2 border-t border-slate-50 flex justify-between items-center gap-2 bg-slate-50/50">
                            <div className="text-[10px] text-slate-400 font-bold">{formatDate(o.data_utworzenia)}</div>
                            <div className="flex gap-2">
                              {o.status !== 'ZATWIERDZONE' && (
                                <button 
                                  disabled={!!processingId}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleZatwierdz(o.id); }}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black disabled:opacity-50 hover:bg-emerald-700 transition-colors"
                                >ZATWIERDŹ</button>
                              )}
                              <button 
                                disabled={!!processingId}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleKasuj(o.id); }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black hover:bg-red-700 transition-colors"
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

          {activeView === 'reminders' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4 animate-in fade-in">
              <Hammer className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <h3 className="text-slate-900 font-bold">Moduł w budowie</h3>
                <p className="text-sm">Funkcja przypomnień będzie dostępna wkrótce.</p>
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="max-w-2xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Asystent Magazyniera v3.0</h2>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">System zarządzania zgłoszeniami OST/ZAPAS</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Profesjonalne narzędzie do ewidencji i zarządzania przepływem towarów. 
                  Umożliwia szybkie generowanie zgłoszeń odbioru starego sprzętu (OST) 
                  oraz kontrolę stanów zapasowych.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Wersja</div>
                    <div className="text-sm font-bold">3.0.0 Stable</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Status Backend</div>
                    <div className="text-sm font-bold text-emerald-600">Połączono (n8n)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showNewOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm uppercase tracking-wider">Nowe Zgłoszenie</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddNewOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Referencja</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required autoFocus placeholder="NP. 2M3390"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={newOrderForm.referencja} onChange={e => setNewOrderForm(f => ({ ...f, referencja: e.target.value }))}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                    title="Skanuj kod"
                  >
                    <ScanBarcode className="w-5 h-5 text-slate-600" />
                  </button>
                  <button 
                    type="button" 
                    disabled={isAnalyzingAI}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                    title="AI Foto Skaner (OCR)"
                  >
                    {isAnalyzingAI ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleAIPhotoSelect} 
                  />
                </div>
                {isAnalyzingAI && (
                  <p className="text-[10px] text-blue-600 font-bold animate-pulse mt-1 ml-1">AI analizuje zdjęcie...</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Typ</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={newOrderForm.typ} onChange={e => setNewOrderForm(f => ({ ...f, typ: e.target.value as any }))}
                  >
                    <option value="OST">OST</option>
                    <option value="ZAPAS">ZAPAS</option>
                  </select>
                </div>
                
                {newOrderForm.typ === 'OST' && (
                  <div className="space-y-1 animate-in slide-in-from-right-2 duration-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ilość</label>
                    <input 
                      type="number" required min="1" placeholder="ILOŚĆ"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={newOrderForm.ilosc} onChange={e => setNewOrderForm(f => ({ ...f, ilosc: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-900">ANULUJ</button>
                <button type="submit" disabled={isAdding} className="flex-[2] bg-blue-600 text-white py-3 px-6 rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all">
                  {isAdding ? 'DODAWANIE...' : 'DODAJ ZGŁOSZENIE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-8">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;