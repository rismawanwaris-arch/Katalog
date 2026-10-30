import React, { useState, useEffect } from 'react';
import { 
  Package, Tag, Globe, Settings, Users, History, ArrowLeft, LogOut, 
  Smartphone, Menu, X, RefreshCw, ExternalLink
} from 'lucide-react';
import ItemsManager from './ItemsManager';
import CategoriesManager from './CategoriesManager';
import ApiManager from './ApiManager';
import UsersManager from './UsersManager';
import ActivityLogsManager from './ActivityLogsManager';
import SettingsManager from './SettingsManager';

export default function AdminDashboard({ adminToken, outlets = [], onExitAdmin, onLogout }) {
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'categories', 'users', 'logs', 'api', 'settings'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': adminToken }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const navSections = [
    {
      title: 'Katalog & Master Data',
      items: [
        {
          id: 'items',
          label: 'Kelola Item',
          icon: Package,
          count: stats?.totalProducts,
          description: 'Spesifikasi 17 kolom & foto'
        },
        {
          id: 'categories',
          label: 'Kategori & Brand',
          icon: Tag,
          count: stats ? `${stats.totalCategories}/${stats.totalBrands}` : null,
          description: 'Merk & klasifikasi barang'
        },
      ]
    },
    {
      title: 'Akses & Pengguna',
      items: [
        {
          id: 'users',
          label: 'Kelola Pengguna',
          icon: Users,
          count: stats?.totalUsers,
          description: 'Kasir, supervisor & admin'
        },
        {
          id: 'logs',
          label: 'Log Aktifitas',
          icon: History,
          description: 'Audit jejak sistem & reset'
        },
      ]
    },
    {
      title: 'Sistem & Konfigurasi',
      items: [
        {
          id: 'api',
          label: 'Integrasi API Stok',
          icon: Globe,
          badge: 'Online',
          description: 'Sinkron real-time cabang'
        },
        {
          id: 'settings',
          label: 'Pengaturan & Sandi',
          icon: Settings,
          description: 'Keamanan & parameter sistem'
        },
      ]
    }
  ];

  function getPageHeader() {
    switch (activeTab) {
      case 'items':
        return {
          title: 'Kelola Item Aksesoris',
          subtitle: 'Database spesifikasi 17 kolom, stok cabang, pencarian & gambar produk',
          icon: Package
        };
      case 'categories':
        return {
          title: 'Kategori & Merk (Brand)',
          subtitle: 'Klasifikasi aksesoris, manajemen merk resmi & segmentasi produk',
          icon: Tag
        };
      case 'users':
        return {
          title: 'Kelola Pengguna & Akses Kasir',
          subtitle: 'Manajemen akun per cabang, hak akses (Superadmin/Kasir), dan reset password',
          icon: Users
        };
      case 'logs':
        return {
          title: 'Log Aktifitas & Riwayat Audit',
          subtitle: 'Rekam jejak tindakan admin, mutasi data, dan audit keamanan sistem',
          icon: History
        };
      case 'api':
        return {
          title: 'Integrasi API Stok Toko Cabang',
          subtitle: 'Koneksi real-time ke sistem laporan stok cabang ALFA 1 - 20 & HO',
          icon: Globe
        };
      case 'settings':
        return {
          title: 'Pengaturan & Keamanan Admin',
          subtitle: 'Ganti password akun administrator dan parameter konfigurasi database',
          icon: Settings
        };
      default:
        return { title: 'Panel Administrator', subtitle: '', icon: Smartphone };
    }
  }

  const currentHeader = getPageHeader();
  const HeaderIcon = currentHeader.icon;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Mobile Topbar */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">PANEL ADMIN</div>
              <div className="text-[10px] text-sky-400 font-medium">{currentHeader.title}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onExitAdmin}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            title="Lihat Katalog Publik"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop: Sticky Sidebar, Mobile: Slide-in Drawer) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white tracking-wide text-sm">ADMINISTRATOR</span>
                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Katalog &amp; Manajemen Stok</p>
            </div>
          </div>

          {/* Close button for Mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.title}
              </div>
              <div className="space-y-1">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/25 ring-1 ring-sky-400/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'
                        }`} />
                        <div className="text-left truncate">
                          <div className="truncate leading-tight">{item.label}</div>
                          {item.description && (
                            <div className={`text-[10px] font-normal truncate ${
                              isActive ? 'text-sky-100' : 'text-slate-400'
                            }`}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges / Counters */}
                      {item.count !== undefined && item.count !== null && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ml-2 ${
                          isActive
                            ? 'bg-sky-700/80 text-white'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 ml-2">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 space-y-2 bg-slate-900/95">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition border border-slate-700/60"
          >
            <div className="flex items-center gap-2.5">
              <ArrowLeft className="w-4 h-4 text-sky-400" />
              <span>Lihat Katalog Publik</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold transition border border-rose-800/30 group"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 group-hover:rotate-6 transition-transform" />
              <span>Keluar (Logout)</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-400/80 group-hover:text-white">Admin</span>
          </button>

          <div className="pt-2 px-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Katalog Aksesoris</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Aktif
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Desktop Topbar Header */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {currentHeader.title}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  {activeTab}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentHeader.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadStats}
              disabled={loadingStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition"
              title="Perbarui Statistik Admin"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin text-sky-600' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lihat Katalog</span>
            </button>
          </div>
        </header>

        {/* View Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto">
          {activeTab === 'items' && (
            <ItemsManager adminToken={adminToken} onStatsUpdated={loadStats} />
          )}

          {activeTab === 'categories' && (
            <CategoriesManager adminToken={adminToken} onStatsUpdated={loadStats} />
          )}

          {activeTab === 'users' && (
            <UsersManager adminToken={adminToken} outlets={outlets} onStatsUpdated={loadStats} />
          )}

          {activeTab === 'logs' && (
            <ActivityLogsManager adminToken={adminToken} />
          )}

          {activeTab === 'api' && (
            <ApiManager adminToken={adminToken} onStatsUpdated={loadStats} />
          )}

          {activeTab === 'settings' && (
            <SettingsManager adminToken={adminToken} />
          )}
        </main>

      </div>

    </div>
  );
}
