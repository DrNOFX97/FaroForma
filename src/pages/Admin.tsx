import { useState, useEffect } from 'react';
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

  const unreadCount = (data?.alunos?.length || 0) + (data?.contactos?.length || 0);

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
            <button className="btn btn--icon mobile-only" onClick={() => setMobileMenuOpen(true)} style={{ display: 'none' }}>
              <Menu size={20} />
            </button>
            <div className="search-pill">
              <SearchIcon size={16} />
              <span>Pesquisar em todo o sistema...</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="notification-bell">
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
                {activeTab === 'dashboard' && <DashboardView data={data} />}
                {activeTab === 'formadores' && <FormadoresTable data={data?.formadores || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingRow} onDetail={setDetailRow} />}
                {activeTab === 'alunos' && <TableView type="alunos" data={data?.alunos || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingGenericRow} onDetail={setDetailRow} />}
                {activeTab === 'contactos' && <TableView type="contactos" data={data?.contactos || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingGenericRow} onDetail={setDetailRow} />}
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
  }

  .notification-bell {
    position: relative;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.2s;
  }
  .notification-bell:hover { color: var(--text); }
  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    background: #ef4444;
    color: white;
    font-size: 0.65rem;
    font-weight: 800;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg-1);
  }

  .admin-badge { font-size: 0.6rem; background: var(--accent); color: white; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; }
  .admin-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border); }
  .admin-user-pill { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; font-size: 0.9rem; }

  /* Table styling enhancements */
  .admin-table-container { border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-1); border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
  .admin-table th { background: var(--bg-2); padding: 1rem; font-weight: 700; color: var(--text); border-bottom: 2px solid var(--border); }
  .admin-table td { padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-muted); }
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
