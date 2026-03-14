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
  Calendar as CalendarIcon
} from 'lucide-react';

import { apiService } from '../services/api';
import type { RawData } from '../services/api';
import { DashboardView } from '../components/admin/DashboardView';
import { FormadoresTable } from '../components/admin/FormadoresTable';
import { TableView } from '../components/admin/TableView';
import { AgendaView } from '../components/admin/AgendaView';
import { CoursesView } from '../components/admin/CoursesView';
import { ConfigView } from '../components/admin/ConfigView';
import { DetailModal } from '../components/admin/DetailModal';
import { EditFormadorModal } from '../components/admin/EditFormadorModal';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<RawData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
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
          setError('Erro de rede: ' + err.message);
        }
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    setError('');
    try {
      const json = await apiService.getAdminData();
      setData(json);
    } catch (err: any) {
      if (err.message === 'ACCESS_DENIED') {
        setError('Acesso negado. Apenas administradores autorizados têm permissão.');
        await signOut(auth);
      } else {
        setError('Erro de rede: ' + err.message);
      }
    } finally {
      setFetching(false);
    }
  };

  const login = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged trata o resto
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao fazer login: ' + err.message);
      }
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

  return (
    <div className="admin-layout">
      {/* Header instead of Sidebar */}
      <header className="admin-header-top glass">
        <div className="container admin-header-inner">
          <div className="admin-logo">
            <span className="gradient-text">FaroForma</span>
            <span className="admin-badge">Admin</span>
          </div>

          <nav className="admin-nav-top">
            <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
            <NavItem active={activeTab === 'formadores'} icon={<Users size={18} />} label="Formadores" onClick={() => setActiveTab('formadores')} />
            <NavItem active={activeTab === 'alunos'} icon={<GraduationCap size={18} />} label="Alunos" onClick={() => setActiveTab('alunos')} />
            <NavItem active={activeTab === 'contactos'} icon={<MessageSquare size={18} />} label="Contactos" onClick={() => setActiveTab('contactos')} />
            <NavItem active={activeTab === 'agenda'} icon={<CalendarIcon size={18} />} label="Agenda" onClick={() => setActiveTab('agenda')} />
            <NavItem active={activeTab === 'cursos'} icon={<Award size={18} />} label="Cursos" onClick={() => setActiveTab('cursos')} />
            <NavItem active={activeTab === 'config'} icon={<Settings size={18} />} label="Definições" onClick={() => setActiveTab('config')} />
          </nav>

          <div className="admin-header-right">
            <div className="admin-user-pill">
              <img src={user.photoURL || ''} alt="" className="admin-avatar" />
              <span>{user.displayName?.split(' ')[0]}</span>
            </div>
            <button className="admin-logout-btn" onClick={logout} title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main-alt">
        <div className="container">
          <div className="admin-content-title">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          </div>

          <div className="admin-content">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <DashboardView data={data} error={error} />}
                {activeTab === 'formadores' && <FormadoresTable data={data?.formadores || []} fetching={fetching} onRefresh={fetchData} onEdit={setEditingRow} onDetail={setDetailRow} />}
                {activeTab === 'alunos' && <TableView type="alunos" data={data?.alunos || []} fetching={fetching} onDetail={setDetailRow} />}
                {activeTab === 'contactos' && <TableView type="contactos" data={data?.contactos || []} fetching={fetching} onDetail={setDetailRow} />}
                {activeTab === 'agenda' && <AgendaView data={data} />}
                {activeTab === 'cursos' && <CoursesView />}
                {activeTab === 'config' && <ConfigView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editingRow && (
          <EditFormadorModal 
            row={editingRow} 
            onClose={() => setEditingRow(null)} 
            onSuccess={() => { setEditingRow(null); fetchData(); }}
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

// ── Components ─────────────────────────────────────────────────────────────────

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button className={`admin-nav-item ${active ? 'is-active' : ''}`} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const ADMIN_STYLES = `
  .admin-layout { min-height: 100vh; background: var(--bg); }
  
  .admin-header-top { position: fixed; top: 0; left: 0; right: 0; height: 72px; z-index: 100; border-bottom: 1px solid var(--border); backdrop-filter: blur(16px); background: rgba(var(--bg-rgb), 0.8); }
  .admin-header-inner { height: 100%; display: flex; align-items: center; justify-content: space-between; }
  
  .admin-logo { font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem; }
  .admin-badge { font-size: 0.6rem; background: var(--accent); color: white; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; }
  
  .admin-nav-top { display: flex; gap: 0.5rem; }
  .admin-nav-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.85rem; border-radius: var(--radius); color: var(--text-muted); font-weight: 600; font-size: 0.85rem; transition: all 0.2s; cursor: pointer; border: none; background: transparent; }
  .admin-nav-item:hover { background: var(--bg-1); color: var(--text); }
  .admin-nav-item.is-active { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
  
  .admin-header-right { display: flex; align-items: center; gap: 1rem; }
  .admin-user-pill { display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.75rem; background: var(--bg-1); border: 1px solid var(--border); border-radius: 100px; font-size: 0.8rem; font-weight: 600; }
  .admin-avatar { width: 20px; height: 20px; border-radius: 50%; }
  
  .admin-logout-btn { color: #ef4444; background: none; border: none; cursor: pointer; display: flex; align-items: center; opacity: 0.7; transition: opacity 0.2s; }
  .admin-logout-btn:hover { opacity: 1; }

  .admin-tabs { display: flex; gap: 0.5rem; background: var(--bg-1); padding: 0.4rem; border-radius: var(--radius); border: 1px solid var(--border); width: fit-content; }
  .admin-tab { padding: 0.5rem 1.5rem; border-radius: calc(var(--radius) - 2px); border: none; background: transparent; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
  .admin-tab:hover { color: var(--text); }
  .admin-tab.is-active { background: var(--bg); color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  .admin-main-alt { padding-top: 104px; padding-bottom: 4rem; }
  .admin-content-title { margin-bottom: 2rem; }
  .admin-content-title h2 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }

  .admin-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
  .stat-card { padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--bg-1); }
  .stat-card__header { display: flex; justify-content: space-between; color: var(--text-muted); margin-bottom: 1rem; font-weight: 600; font-size: 0.9rem; }
  .stat-card__val { font-size: 2.25rem; font-weight: 800; }
  
  .admin-loading { height: 100vh; display: flex; align-items: center; justify-content: center; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  .spinner--small { width: 20px; height: 20px; border-width: 2px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .admin-table-container { border-radius: var(--radius-lg); overflow: hidden; }
  .admin-table-scroll { overflow-x: auto; }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; }
  .admin-table th { background: var(--bg-1); padding: 1rem; font-weight: 700; color: var(--text); border-bottom: 2px solid var(--border); white-space: nowrap; }
  .admin-table td { padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .admin-table tr:hover td { background: rgba(16, 185, 129, 0.05); color: var(--text); }
  
  .admin-action-btn { padding: 6px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg); color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
  .admin-action-btn:hover { color: var(--accent); border-color: var(--accent); }

  .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; backdrop-filter: blur(4px); }
  .admin-modal { background: var(--bg); width: 100%; max-width: 720px; border-radius: var(--radius-xl); border: 1px solid var(--border); display: flex; flex-direction: column; max-height: 90vh; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
  .admin-modal--large { max-width: 1100px; }
  .admin-modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .admin-modal-header h3 { font-size: 1.25rem; font-weight: 700; }
  .admin-close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 50%; transition: all 0.2s; }
  .admin-close-btn:hover { background: var(--bg-1); color: var(--text); }
  .admin-modal-body { padding: 2rem; overflow-y: auto; }
  .admin-modal-footer { padding: 1.25rem 2rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: var(--bg-1); }

  .detail-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  .detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
  .detail-item label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
  .detail-item div { font-size: 1rem; color: var(--text); line-height: 1.5; }

  .agenda-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .agenda-day { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
  .agenda-day-header { font-weight: 800; font-size: 0.9rem; text-align: center; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); color: var(--accent); }
  .agenda-slot { display: flex; flex-direction: column; gap: 0.4rem; }
  .agenda-slot label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
  .agenda-select { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 0.4rem; font-size: 0.8rem; color: var(--text); width: 100%; cursor: pointer; }
  .agenda-select:focus { border-color: var(--accent); outline: none; }
  .agenda-select:disabled { opacity: 0.5; cursor: not-allowed; }
  .agenda-slot--full { flex: 1; display: flex; flex-direction: column; justify-content: center; }

  /* Print Specific Styling */
  .print-sheet { background: white; color: black; padding: 25mm; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 297mm; margin: 0 auto; min-height: 210mm; font-family: sans-serif; display: flex; flex-direction: column; }
  .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid black; padding-bottom: 1rem; margin-bottom: 2rem; }
  .print-logo { font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; }
  .print-title { font-size: 1.25rem; font-weight: 700; }
  .print-date { font-size: 0.8rem; opacity: 0.7; }
  .print-table { width: 100%; border-collapse: collapse; flex: 1; }
  .print-table th, .print-table td { border: 1px solid #ddd; padding: 1rem; text-align: left; vertical-align: top; }
  .print-table th { background: #f8f8f8; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; }
  .print-day-cell { background: #fafafa; font-weight: 800; width: 120px; }
  .print-entry { display: flex; flex-direction: column; gap: 0.2rem; }
  .print-entry strong { font-size: 0.95rem; color: black; }
  .print-entry span { font-size: 0.8rem; color: #666; }
  .print-full-cell { background: rgba(0,0,0,0.02); }
  .print-footer { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; font-size: 0.75rem; text-align: center; opacity: 0.5; }

  @media print {
    body * { visibility: hidden; }
    .print-sheet, .print-sheet * { visibility: visible; }
    .print-sheet { position: absolute; left: 0; top: 0; width: 100%; height: 100%; box-shadow: none; padding: 10mm; }
    .admin-modal-overlay { background: none; padding: 0; position: static; }
    .admin-modal-header, .admin-modal-footer { display: none !important; }
    .admin-modal { border: none; box-shadow: none; background: white; max-width: none; max-height: none; }
    .admin-modal-body { padding: 0; background: white !important; }
  }
`;
