import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Lock,
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search as SearchIcon,
  Menu,
  FileText
} from 'lucide-react';

import { apiService } from '../services/api';
import type { RawData } from '../services/api';
import { DashboardView } from '../components/admin/DashboardView';
import { FormadoresTable } from '../components/admin/FormadoresTable';
import { TableView } from '../components/admin/TableView';
import { AgendaView } from '../components/admin/AgendaView';
import { CoursesView } from '../components/admin/CoursesView';
import { ConfigView } from '../components/admin/ConfigView';
import { CMSView } from '../components/admin/CMSView';
import { DetailModal } from '../components/admin/DetailModal';
import { EditFormadorModal } from '../components/admin/EditFormadorModal';
import { EditRowModal } from '../components/admin/EditRowModal';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<RawData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [lastViewedAt, setLastViewedAt] = useState<Date>(() => {
    const ts = localStorage.getItem('admin_notif_viewed');
    return ts && !isNaN(Date.parse(ts)) ? new Date(ts) : new Date(0);
  });
  const notifRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // Modals
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [editingGenericRow, setEditingGenericRow] = useState<any | null>(null);
  const [detailRow, setDetailRow] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const json = await apiService.getAdminData();
        setUser(u);
        setData(json);
        setError('');
      } catch (err: any) {
        if (err.message === 'ACCESS_DENIED') {
          setError('Acesso negado. Apenas administradores autorizados têm permissão.');
        } else {
          setError('Erro de ligação: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  useEffect(() => {
    if (!searchQuery) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchQuery]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const json = await apiService.getAdminData();
      setData(json);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const login = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError('Erro ao fazer login: ' + err.message);
    }
  };

  const logout = () => signOut(auth);

  // ── Memoized computations (must be before conditional returns) ────────────
  const notifItems = useMemo(() => {
    if (!data) return [];
    const items: { type: string; name: string; desc: string; date: Date; tab: string }[] = [];
    data.alunos?.slice(1).forEach(r => {
      const d = new Date(r[0]);
      if (!isNaN(d.getTime())) items.push({ type: 'aluno', name: r[1], desc: `Inscrição em ${r[4] || '—'}`, date: d, tab: 'alunos' });
    });
    data.contactos?.slice(1).forEach(r => {
      const d = new Date(r[0]);
      if (!isNaN(d.getTime())) items.push({ type: 'contacto', name: r[1], desc: r[4] || '—', date: d, tab: 'contactos' });
    });
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [data]);

  const unreadCount = useMemo(
    () => notifItems.filter(n => n.date > lastViewedAt).length,
    [notifItems, lastViewedAt]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !data) return [];
    const results: { tab: string; label: string; name: string; sub: string }[] = [];
    const match = (...fields: any[]) => fields.some(f => String(f || '').toLowerCase().includes(q));
    data.formadores?.slice(1).forEach(r => {
      if (match(r[1], r[2], r[3], r[5]))
        results.push({ tab: 'formadores', label: 'Formador', name: r[1], sub: r[2] || r[3] || '' });
    });
    data.alunos?.slice(1).forEach(r => {
      if (match(r[1], r[2], r[3]))
        results.push({ tab: 'alunos', label: 'Aluno', name: r[1], sub: r[4] || r[2] || '' });
    });
    data.contactos?.slice(1).forEach(r => {
      if (match(r[1], r[2], r[3], r[4]))
        results.push({ tab: 'contactos', label: 'Contacto', name: r[1], sub: r[4] || r[2] || '' });
    });
    return results.slice(0, 8);
  }, [searchQuery, data]);

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div></div>;
  }

  if (!user) {
    return (
      <div className="admin-login-page">
        <motion.div className="admin-login-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-login-header">
            <div className="admin-icon-box"><Lock className="w-8 h-8 text-accent" /></div>
            <h1>Backoffice <span className="gradient-text">FaroForma</span></h1>
            <p>Área restrita para gestão de candidaturas e configurações.</p>
          </div>
          {error && <div className="admin-error"><AlertCircle className="w-4 h-4" /> {error}</div>}
          <button className="btn btn--primary btn--full" onClick={login}>Entrar com Google</button>
        </motion.div>
        <style>{ADMIN_STYLES}</style>
      </div>
    );
  }

  const openNotif = () => {
    setNotifOpen(o => {
      if (!o) {
        const now = new Date();
        localStorage.setItem('admin_notif_viewed', now.toISOString());
        setLastViewedAt(now);
      }
      return !o;
    });
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${mobileMenuOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="gradient-text">FaroForma</span>
            <span className="admin-badge">Admin</span>
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Geral</div>
          <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          <SidebarItem active={activeTab === 'agenda'} icon={<CalendarIcon size={20} />} label="Agenda & Salas" onClick={() => { setActiveTab('agenda'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

          <div className="nav-group-label">Gestão de Dados</div>
          <SidebarItem active={activeTab === 'formadores'} icon={<Users size={20} />} label="Formadores" onClick={() => { setActiveTab('formadores'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          <SidebarItem active={activeTab === 'alunos'} icon={<GraduationCap size={20} />} label="Alunos" onClick={() => { setActiveTab('alunos'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          <SidebarItem active={activeTab === 'contactos'} icon={<MessageSquare size={20} />} label="Contactos" onClick={() => { setActiveTab('contactos'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

          <div className="nav-group-label">Conteúdo Site</div>
          <SidebarItem active={activeTab === 'cursos'} icon={<Award size={20} />} label="Cursos" onClick={() => { setActiveTab('cursos'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          <SidebarItem active={activeTab === 'cms'} icon={<FileText size={20} />} label="Editor de Páginas" onClick={() => { setActiveTab('cms'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

          <div className="nav-group-label">Configurações</div>
          <SidebarItem active={activeTab === 'config'} icon={<Settings size={20} />} label="SEO & Definições" onClick={() => { setActiveTab('config'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={logout} style={{ color: '#ef4444' }}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Terminar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="btn btn--icon mobile-only" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="search-pill" ref={searchRef}>
              <SearchIcon size={16} />
              <input
                className="search-pill-input"
                placeholder="Pesquisar nome, email, NIF..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
              />
              {searchQuery && searchResults.length === 0 && (
                <div className="search-dropdown glass">
                  <div className="search-empty">Sem resultados para "{searchQuery}"</div>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="search-dropdown glass">
                  {searchResults.map((r) => (
                    <button
                      key={`${r.tab}-${r.name}-${r.sub}`}
                      className="search-result-item"
                      onClick={() => { setActiveTab(r.tab); setSearchQuery(''); }}
                    >
                      <span className={`search-type-badge ${r.tab}`}>{r.label}</span>
                      <div className="search-result-body">
                        <span className="search-result-name">{r.name}</span>
                        <span className="search-result-sub">{r.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <div className="notification-bell" ref={notifRef}>
              <button className="notif-bell-btn" onClick={openNotif} aria-label="Notificações">
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown glass">
                  <div className="notif-header">
                    <span>Notificações recentes</span>
                    {unreadCount > 0 && <span className="notif-new-pill">{unreadCount} novas</span>}
                  </div>
                  {notifItems.length === 0 ? (
                    <div className="notif-empty">Sem registos recentes.</div>
                  ) : notifItems.map((n) => (
                    <button
                      key={`${n.date.getTime()}-${n.name}`}
                      className={`notif-item ${n.date > lastViewedAt ? 'is-new' : ''}`}
                      onClick={() => { setActiveTab(n.tab); setNotifOpen(false); }}
                    >
                      <div className={`notif-dot ${n.type}`} />
                      <div className="notif-item-body">
                        <span className="notif-name">{n.name}</span>
                        <span className="notif-desc">{n.desc}</span>
                        <span className="notif-time">{n.date.toLocaleDateString('pt-PT')} · {n.date.getHours()}h{String(n.date.getMinutes()).padStart(2,'0')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-user-pill">
              <img src={user.photoURL || ''} alt="" className="admin-avatar" />
              <span>{user.displayName?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="admin-content-area">
          <div className="admin-content-title" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {activeTab === 'config' ? 'SEO & Definições' : 
               activeTab === 'cms' ? 'Editor de Páginas (CMS)' :
               activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>

          <div className="admin-view-container">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <DashboardView data={data} onNavigate={setActiveTab} />}
                {activeTab === 'formadores' && <FormadoresTable data={data?.formadores || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingRow} onDetail={setDetailRow} />}
                {activeTab === 'alunos' && <TableView type="alunos" data={data?.alunos || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingGenericRow} onDetail={setDetailRow} columns={[1, 3, 4]} />}
                {activeTab === 'contactos' && <TableView type="contactos" data={data?.contactos || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingGenericRow} onDetail={setDetailRow} headerMap={{ 0: 'Data/Hora' }} cellFormat={{ 0: v => { const d = new Date(v); return isNaN(d.getTime()) ? v : `${d.toLocaleDateString('pt-PT')} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`; } }} />}
                {activeTab === 'agenda' && <AgendaView data={data} />}
                {activeTab === 'cursos' && <CoursesView />}
                {activeTab === 'config' && <ConfigView />}
                {activeTab === 'cms' && <CMSView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {editingRow && (
          <EditFormadorModal 
            row={editingRow} 
            onClose={() => setEditingRow(null)} 
            onSuccess={() => { setEditingRow(null); fetchData(); }}
          />
        )}
        {editingGenericRow && (
          <EditRowModal 
            row={editingGenericRow}
            headers={editingGenericRow.type === 'alunos' ? (data?.alunos?.[0] || []) : (data?.contactos?.[0] || [])}
            onClose={() => setEditingGenericRow(null)}
            onSuccess={() => { setEditingGenericRow(null); fetchData(); }}
          />
        )}
        {detailRow && (
          <DetailModal 
            data={detailRow} 
            onClose={() => setDetailRow(null)} 
          />
        )}
      </AnimatePresence>

      <style>{ADMIN_STYLES}</style>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick, collapsed }: any) {
  return (
    <button className={`sidebar-item ${active ? 'is-active' : ''}`} onClick={onClick} title={collapsed ? label : ''}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

const ADMIN_STYLES = `
  :root {
    --sidebar-width: 260px;
    --sidebar-collapsed-width: 80px;
    --topbar-height: 64px;
  }

  .admin-layout { 
    display: flex; 
    min-height: 100vh; 
    background: var(--bg); 
    color: var(--text);
  }
  
  /* Sidebar */
  .admin-sidebar {
    width: var(--sidebar-width);
    height: 100vh;
    background: var(--bg-1);
    border-right: 1px solid var(--border);
    position: fixed;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    z-index: 1000;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  
  .admin-sidebar.is-collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .sidebar-header {
    height: var(--topbar-height);
    display: flex;
    align-items: center;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--border);
    justify-content: space-between;
  }

  .sidebar-logo {
    font-weight: 800;
    font-size: 1.1rem;
    white-space: nowrap;
    opacity: 1;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .is-collapsed .sidebar-logo { opacity: 0; pointer-events: none; }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
  }

  .nav-group-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    padding: 1.25rem 0.75rem 0.5rem;
  }
  .is-collapsed .nav-group-label { display: none; }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }

  .sidebar-item:hover { background: var(--bg-2); color: var(--text); }
  .sidebar-item.is-active { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
  
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Main Wrapper */
  .admin-main-wrapper {
    flex: 1;
    margin-left: var(--sidebar-width);
    min-width: 0;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .is-sidebar-collapsed .admin-main-wrapper {
    margin-left: var(--sidebar-collapsed-width);
  }

  .admin-topbar {
    height: var(--topbar-height);
    background: rgba(var(--bg-rgb), 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 900;
  }

  .topbar-left { display: flex; align-items: center; gap: 1rem; }
  .topbar-right { display: flex; align-items: center; gap: 1.5rem; }

  .admin-content-area {
    padding: 2.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Components & Utilities */
  .collapse-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--bg-1);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
  }
  .collapse-btn:hover { border-color: var(--accent); color: var(--accent); }

  .search-pill {
    position: relative;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 300px;
    color: var(--text-muted);
    font-size: 0.85rem;
    transition: border-color 0.2s;
  }
  .search-pill:focus-within {
    border-color: var(--accent);
    border-radius: 12px 12px 0 0;
  }
  .search-pill-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 0.85rem;
    width: 100%;
  }
  .search-pill-input::placeholder { color: var(--text-muted); }
  .search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    border: 1px solid var(--accent);
    border-top: none;
    border-radius: 0 0 12px 12px;
    background: var(--bg-1);
    z-index: 2000;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .search-empty { padding: 1rem 1.25rem; color: var(--text-muted); font-size: 0.85rem; }
  .search-result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border);
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }
  .search-result-item:last-child { border-bottom: none; }
  .search-result-item:hover { background: var(--bg-2); }
  .search-type-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 7px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .search-type-badge.formadores { background: rgba(16,185,129,0.1); color: #10b981; }
  .search-type-badge.alunos { background: rgba(59,130,246,0.1); color: #3b82f6; }
  .search-type-badge.contactos { background: rgba(139,92,246,0.1); color: #8b5cf6; }
  .search-result-body { display: flex; flex-direction: column; min-width: 0; }
  .search-result-name { font-size: 0.85rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .search-result-sub { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .notification-bell { position: relative; }
  .notif-bell-btn {
    position: relative;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: color 0.2s, background 0.2s;
  }
  .notif-bell-btn:hover { color: var(--text); background: var(--bg-2); }
  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 16px;
    height: 16px;
    background: #ef4444;
    color: white;
    font-size: 0.6rem;
    font-weight: 800;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 3px;
    border: 2px solid var(--bg-1);
  }
  .notif-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 320px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 2000;
    overflow: hidden;
    background: var(--bg-1);
  }
  .notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    font-weight: 700;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--border);
  }
  .notif-new-pill { font-size: 0.7rem; background: rgba(239,68,68,0.1); color: #ef4444; padding: 2px 8px; border-radius: 100px; font-weight: 700; }
  .notif-empty { padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
  .notif-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 1.25rem;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border);
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    align-items: flex-start;
  }
  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: var(--bg-2); }
  .notif-item.is-new { background: rgba(16,185,129,0.04); }
  .notif-item.is-new:hover { background: rgba(16,185,129,0.08); }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .notif-dot.aluno { background: #3b82f6; }
  .notif-dot.contacto { background: #8b5cf6; }
  .notif-item-body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
  .notif-name { font-size: 0.85rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .notif-desc { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .notif-time { font-size: 0.7rem; color: var(--text-dim); margin-top: 0.2rem; }

  .admin-badge { font-size: 0.6rem; background: var(--accent); color: white; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; }
  .admin-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); }
  .admin-user-pill { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; }

  /* Table styling enhancements */
  .admin-table-container { border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-1); border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
  .admin-table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .admin-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .admin-table th { background: var(--bg-2); padding: 0.6rem 0.75rem; font-weight: 700; font-size: 0.78rem; color: var(--text); border-bottom: 2px solid var(--border); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
  .admin-table td { padding: 0.6rem 0.75rem; font-size: 0.82rem; border-bottom: 1px solid var(--border); color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .admin-table td .cell-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: rgba(16, 185, 129, 0.03); color: var(--text); }

  .admin-loading { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .admin-login-page { height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 0% 0%, var(--bg-1) 0%, var(--bg) 50%); }
  .admin-login-card { padding: 3rem; width: 100%; max-width: 440px; text-align: center; }
  .admin-icon-box { width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; }
  .admin-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 1rem; border-radius: var(--radius); margin-bottom: 2rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }

  @media (max-width: 768px) {
    .mobile-only { display: flex !important; }
    .search-pill { display: none; }
    .admin-sidebar { left: -100%; width: 280px !important; }
    .admin-sidebar.is-mobile-open { left: 0; }
    .admin-main-wrapper { margin-left: 0 !important; }
    .admin-content-area { padding: 1.5rem; }
  }
`;
