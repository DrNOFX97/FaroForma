import { useState, useEffect, useRef } from 'react';
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
  Pencil,
  X,
  Save,
  Calendar as CalendarIcon,
  Printer,
  FileDown,
  Eye,
  Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ADMIN_EMAILS = ['faroforma@gmail.com', 'custodio.guerreiro@gmail.com'];

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawData {
  formadores: any[][];
  alunos: any[];
  contactos: any[];
}

// ── Admin Component ────────────────────────────────────────────────────────────

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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && ADMIN_EMAILS.includes(u.email || '')) {
        setUser(u);
        setError('');
        fetchData(u);
      } else if (u) {
        setError('Acesso negado. Apenas administradores autorizados têm permissão.');
        signOut(auth);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (u: User) => {
    setFetching(true);
    setError('');
    try {
      const token = await u.getIdToken();
      const res = await fetch('/api/admin/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const errText = await res.text();
        setError(`Erro ${res.status}: ${errText || res.statusText}`);
      }
    } catch (err: any) {
      setError('Erro de rede: ' + err.message);
    } finally {
      setFetching(false);
    }
  };

  const login = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!ADMIN_EMAILS.includes(result.user.email || '')) {
        setError('Acesso negado. Apenas administradores autorizados têm permissão.');
        await signOut(auth);
      } else {
        fetchData(result.user);
      }
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
                {activeTab === 'formadores' && <FormadoresTable data={data?.formadores || []} fetching={fetching} onRefresh={() => fetchData(user)} onEdit={setEditingRow} onDetail={setDetailRow} />}
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
            onSuccess={() => { setEditingRow(null); fetchData(user); }}
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

function DashboardView({ data, error }: { data: RawData | null, error: string }) {
  const stats = {
    formadores: Math.max(0, (data?.formadores?.length || 1) - 1),
    alunos: Math.max(0, (data?.alunos?.length || 1) - 1),
    contactos: Math.max(0, (data?.contactos?.length || 1) - 1),
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <StatCard label="Formadores" val={stats.formadores} icon={<Users size={20} />} desc="Total de candidaturas" />
        <StatCard label="Alunos" val={stats.alunos} icon={<GraduationCap size={20} />} desc="Novas inscrições" />
        <StatCard label="Contactos" val={stats.contactos} icon={<MessageSquare size={20} />} desc="Mensagens recebidas" />
      </div>
      
      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Estado do Sistema</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!data && !error && <div className="spinner spinner--small"></div>}
          <p style={{ color: 'var(--text-muted)' }}>
            {data ? 'Ligação às Google Sheets ativa.' : (error ? `Erro: ${error}` : 'A sincronizar com Google Sheets...')}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, val, icon, desc }: any) {
  return (
    <div className="stat-card">
      <div className="stat-card__header"><span>{label}</span>{icon}</div>
      <div className="stat-card__val">{val}</div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{desc}</p>
    </div>
  );
}

function FormadoresTable({ data, fetching, onEdit, onDetail }: { data: any[][], fetching: boolean, onRefresh: () => void, onEdit: (row: any) => void, onDetail: (row: any) => void }) {
  if (fetching) return <div className="glass" style={{ padding: '2rem' }}>A carregar dados...</div>;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem candidaturas para mostrar.</div>;

  const indexedRows = data.slice(1).map((row, idx) => ({ 
    originalIndex: idx + 1,
    cells: row 
  })).reverse();

  return (
    <div className="admin-table-container glass">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Áreas</th>
              <th>Dias</th>
              <th>Períodos</th>
              <th>Modalidade</th>
              <th>Data Registo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {indexedRows.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700 }}>#{item.originalIndex}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>{item.cells[1]}</td>
                <td>{item.cells[2]}</td>
                <td>{item.cells[3]}</td>
                <td title={item.cells[6]}>{item.cells[6]}</td>
                <td>{item.cells[11]}</td>
                <td>{item.cells[12]}</td>
                <td>{item.cells[13]}</td>
                <td>{new Date(item.cells[0]).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-action-btn" onClick={() => onDetail(item)} title="Ver Detalhes">
                      <Search size={16} />
                    </button>
                    <button className="admin-action-btn" onClick={() => onEdit(item)} title="Editar">
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailModal({ data, onClose }: { data: any, onClose: () => void }) {
  const isFormador = Array.isArray(data.cells);
  const fields = isFormador ? data.cells : Object.entries(data);

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="admin-modal-header">
          <h3>Detalhes do Registo {data.originalIndex ? `#${data.originalIndex}` : ''}</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="detail-grid">
            {isFormador ? (
              // Formadores data is an array
              data.cells.map((val: any, idx: number) => (
                <div key={idx} className="detail-item">
                  <label>Campo {idx}</label>
                  <div>{val || <span className="text-muted">—</span>}</div>
                </div>
              ))
            ) : (
              // Other data (alunos, contactos) might be objects
              Object.entries(data).filter(([key]) => key !== 'originalIndex').map(([key, val]: [string, any]) => (
                <div key={key} className="detail-item">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{typeof val === 'string' || typeof val === 'number' ? val : JSON.stringify(val)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Fechar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditFormadorModal({ row, onClose, onSuccess }: any) {
  const [values, setValues] = useState([...row.cells]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/update-formador', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: row.originalIndex, values: values })
      });
      if (res.ok) { onSuccess(); } else { alert('Erro ao guardar alterações.'); }
    } catch (err) { alert('Erro de rede.'); } finally { setSaving(false); }
  };

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="admin-modal-header">
          <h3>Editar Formador #{row.originalIndex}</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="form__grid">
            <div className="form__group"><label className="form__label">Nome</label><input className="form__input" value={values[1]} onChange={e => { const v = [...values]; v[1] = e.target.value; setValues(v); }} /></div>
            <div className="form__group"><label className="form__label">Email</label><input className="form__input" value={values[2]} onChange={e => { const v = [...values]; v[2] = e.target.value; setValues(v); }} /></div>
            <div className="form__group"><label className="form__label">Telefone</label><input className="form__input" value={values[3]} onChange={e => { const v = [...values]; v[3] = e.target.value; setValues(v); }} /></div>
            <div className="form__group"><label className="form__label">Áreas</label><input className="form__input" value={values[6]} onChange={e => { const v = [...values]; v[6] = e.target.value; setValues(v); }} /></div>
            <div className="form__group">
              <label className="form__label">Habilitações</label>
              <select className="form__input" value={values[7]} onChange={e => { const v = [...values]; v[7] = e.target.value; setValues(v); }}>
                <option value="12ano">12.º Ano</option><option value="licenciatura">Licenciatura</option><option value="mestrado">Mestrado</option><option value="doutoramento">Doutoramento</option><option value="outro">Outro</option>
              </select>
            </div>
            <div className="form__group">
              <label className="form__label">CAP / CCP</label>
              <select className="form__input" value={values[8]} onChange={e => { const v = [...values]; v[8] = e.target.value; setValues(v); }}>
                <option value="sim">Possuo Certificado</option><option value="nao">Não Possuo</option><option value="processo">Em Processo</option>
              </select>
            </div>
            <div className="form__group"><label className="form__label">Dias</label><input className="form__input" value={values[11]} onChange={e => { const v = [...values]; v[11] = e.target.value; setValues(v); }} placeholder="Ex: Segunda, Terça" /></div>
            <div className="form__group"><label className="form__label">Períodos</label><input className="form__input" value={values[12]} onChange={e => { const v = [...values]; v[12] = e.target.value; setValues(v); }} placeholder="Ex: Manhã, Tarde" /></div>
            <div className="form__group">
              <label className="form__label">Modalidade</label>
              <select className="form__input" value={values[13]} onChange={e => { const v = [...values]; v[13] = e.target.value; setValues(v); }}>
                <option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrida">Híbrida</option>
              </select>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'A guardar...' : <><Save size={18} /> Guardar</>}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TableView({ type, data, fetching, onDetail }: { type: string, data: any[][], fetching: boolean, onDetail: (row: any) => void }) {
  if (fetching) return <div className="glass" style={{ padding: '2rem' }}>A carregar dados...</div>;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem dados em <strong>{type}</strong>.</div>;

  const headers = data[0];
  const rows = data.slice(1).reverse().map((row, idx) => ({
    originalIndex: data.length - 1 - idx,
    cells: row
  }));

  return (
    <div className="admin-table-container glass">
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => (
              <tr key={i}>
                {item.cells.map((cell: any, j: number) => <td key={j}>{cell}</td>)}
                <td>
                  <button className="admin-action-btn" onClick={() => {
                    const obj: any = { originalIndex: item.originalIndex };
                    headers.forEach((h: string, idx: number) => {
                      obj[h] = item.cells[idx];
                    });
                    onDetail(obj);
                  }} title="Ver Detalhes">
                    <Search size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfigView() {
  const [config, setConfig] = useState<any>({ title: '', description: '', keywords: '', contactEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setConfig(await res.json()); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) { setMsg('Configurações guardadas!'); setTimeout(() => setMsg(''), 3000); } else { setMsg('Erro ao guardar.'); }
    } catch (err) { setMsg('Erro de rede.'); } finally { setSaving(false); }
  };

  if (loading) return <div className="glass" style={{ padding: '2rem' }}>A carregar configurações...</div>;

  return (
    <div className="admin-config-view">
      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '2rem' }}>Definições do Site</h3>
        <div className="form__grid" style={{ maxWidth: 600 }}>
          <div className="form__group form__group--full"><label className="form__label">Título do Site</label><input type="text" className="form__input" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} /></div>
          <div className="form__group form__group--full"><label className="form__label">Descrição (SEO)</label><textarea className="form__textarea" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} rows={3} /></div>
          <div className="form__group"><label className="form__label">Keywords</label><input type="text" className="form__input" value={config.keywords} onChange={e => setConfig({...config, keywords: e.target.value})} /></div>
          <div className="form__group"><label className="form__label">Email de Contacto</label><input type="email" className="form__input" value={config.contactEmail} onChange={e => setConfig({...config, contactEmail: e.target.value})} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn--primary" onClick={save} disabled={saving}>{saving ? 'A Guardar...' : 'Guardar Alterações'}</button>
            {msg && <span style={{ fontSize: '0.85rem', color: msg.includes('sucesso') ? 'var(--accent)' : '#ef4444' }}>{msg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursesView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setCourses(await res.json()); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async (course: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
      if (res.ok) { 
        setEditingCourse(null);
        fetchCourses();
      }
    } catch (err) { alert('Erro ao guardar curso'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja remover este curso?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { fetchCourses(); }
    } catch (err) { alert('Erro ao remover curso'); }
  };

  if (loading) return <div className="glass" style={{ padding: '2rem' }}>A carregar cursos...</div>;

  return (
    <div className="admin-courses-view">
      <div className="admin-header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Gestão de Cursos</h3>
        <button className="btn btn--primary" onClick={() => setEditingCourse({ title: { pt: '', en: '' }, subtitle: { pt: '', en: '' }, status: { pt: '', en: '' }, description: { pt: '', en: '' }, highlights: [], schedule: [] })}>
          <Award size={18} /> Adicionar Novo Curso
        </button>
      </div>

      <div className="admin-table-container glass">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título (PT)</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td style={{ fontWeight: 600 }}>{course.title?.pt}</td>
                  <td>{course.status?.pt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="admin-action-btn" onClick={() => setEditingCourse(course)} title="Editar"><Pencil size={16} /></button>
                      <button className="admin-action-btn" onClick={() => handleDelete(course.id)} title="Remover" style={{ color: '#ef4444' }}><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum curso registado no Firestore.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingCourse && (
          <CourseEditModal 
            course={editingCourse} 
            onClose={() => setEditingCourse(null)} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseEditModal({ course, onClose, onSave }: any) {
  const [data, setData] = useState({ 
    ...course,
    title: course.title || { pt: '', en: '' },
    subtitle: course.subtitle || { pt: '', en: '' },
    status: course.status || { pt: '', en: '' },
    description: course.description || { pt: '', en: '' },
    schedule: course.schedule || []
  });

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal admin-modal--large glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="admin-modal-header">
          <h3>{data.id ? 'Editar Curso' : 'Novo Curso'}</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="form__grid">
            <div className="form__group"><label className="form__label">Título (PT)</label><input className="form__input" value={data.title.pt} onChange={e => setData({...data, title: {...data.title, pt: e.target.value}})} /></div>
            <div className="form__group"><label className="form__label">Título (EN)</label><input className="form__input" value={data.title.en} onChange={e => setData({...data, title: {...data.title, en: e.target.value}})} /></div>
            <div className="form__group"><label className="form__label">Subtítulo (PT)</label><input className="form__input" value={data.subtitle.pt} onChange={e => setData({...data, subtitle: {...data.subtitle, pt: e.target.value}})} /></div>
            <div className="form__group"><label className="form__label">Subtítulo (EN)</label><input className="form__input" value={data.subtitle.en} onChange={e => setData({...data, subtitle: {...data.subtitle, en: e.target.value}})} /></div>
            <div className="form__group"><label className="form__label">Estado/Badge (PT)</label><input className="form__input" value={data.status.pt} onChange={e => setData({...data, status: {...data.status, pt: e.target.value}})} placeholder="Ex: Inscrições Abertas" /></div>
            <div className="form__group"><label className="form__label">Estado/Badge (EN)</label><input className="form__input" value={data.status.en} onChange={e => setData({...data, status: {...data.status, en: e.target.value}})} /></div>
            <div className="form__group form__group--full"><label className="form__label">Descrição (PT)</label><textarea className="form__textarea" value={data.description.pt} onChange={e => setData({...data, description: {...data.description, pt: e.target.value}})} rows={2} /></div>
            <div className="form__group form__group--full"><label className="form__label">Descrição (EN)</label><textarea className="form__textarea" value={data.description.en} onChange={e => setData({...data, description: {...data.description, en: e.target.value}})} rows={2} /></div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Horários</h4>
            <div className="admin-table-container glass" style={{ padding: '1rem' }}>
              <table className="admin-table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr><th>Turma</th><th>Período</th><th>Horário</th><th>Dias</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {data.schedule.map((s: any, i: number) => (
                    <tr key={i}>
                      <td><input className="form__input" value={s.turma?.pt} onChange={e => { const ns = [...data.schedule]; ns[i].turma = { pt: e.target.value, en: e.target.value }; setData({...data, schedule: ns}); }} style={{ padding: '0.25rem' }} /></td>
                      <td><input className="form__input" value={s.período?.pt} onChange={e => { const ns = [...data.schedule]; ns[i].período = { pt: e.target.value, en: e.target.value }; setData({...data, schedule: ns}); }} style={{ padding: '0.25rem' }} /></td>
                      <td><input className="form__input" value={s.horário} onChange={e => { const ns = [...data.schedule]; ns[i].horário = e.target.value; setData({...data, schedule: ns}); }} style={{ padding: '0.25rem' }} /></td>
                      <td><input className="form__input" value={s.dias?.pt} onChange={e => { const ns = [...data.schedule]; ns[i].dias = { pt: e.target.value, en: e.target.value }; setData({...data, schedule: ns}); }} style={{ padding: '0.25rem' }} /></td>
                      <td><button onClick={() => { const ns = data.schedule.filter((_: any, idx: number) => idx !== i); setData({...data, schedule: ns}); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn--outline btn--small" onClick={() => setData({...data, schedule: [...data.schedule, { turma: { pt: '', en: '' }, período: { pt: '', en: '' }, horário: '', dias: { pt: '', en: '' } }]})} style={{ marginTop: '1rem' }}>+ Adicionar Horário</button>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={() => onSave(data)}><Save size={18} /> Guardar Curso</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Agenda View ────────────────────────────────────────────────────────────────

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SLOTS = ['Manhã (09h-13h)', 'Tarde (13h-18h)', 'Noite (18h-21h)'];

function AgendaView({ data }: { data: RawData | null }) {
  const [room, setRoom] = useState('sala1');
  const [agenda, setAgenda] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formadores = data?.formadores?.slice(1) || [];

  useEffect(() => {
    fetchAgenda();
  }, [room]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/agenda?room=${room}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setAgenda(await res.json()); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const saveAgenda = async () => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/agenda?room=${room}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(agenda)
      });
      if (res.ok) {
        alert(`Agenda ${room.toUpperCase()} guardada com sucesso!`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        alert('Erro ao guardar: ' + (errorData.error || res.statusText));
      }
    } catch (err: any) { alert('Erro de rede: ' + err.message); } finally { setSaving(false); }
  };

  const updateSlot = (day: string, slot: string, field: 'trainer' | 'course', val: string) => {
    const key = `${day}-${slot}`;
    setAgenda({ 
      ...agenda, 
      [key]: { 
        ...(agenda[key] || { trainer: '', course: '' }), 
        [field]: val 
      } 
    });
  };

  const getAvailableTrainers = (day: string, slot: string) => {
    return formadores.filter(f => {
      const availableDays = f[11]?.split(',').map((d: string) => d.trim()) || [];
      const availableSlots = f[12]?.split(',').map((s: string) => s.trim()) || [];
      if (day === 'Sábado') return availableDays.includes('Sábado');
      const slotName = slot.split(' ')[0];
      return availableDays.includes(day) && availableSlots.some((s: string) => s.includes(slotName));
    });
  };

  const getTrainerCourses = (trainerName: string) => {
    const trainer = formadores.find(f => f[1] === trainerName);
    if (!trainer) return [];
    return trainer[6]?.split(',').map((c: string) => c.trim()) || [];
  };

  return (
    <div className="admin-agenda">
      {/* Room Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`admin-tab ${room === 'sala1' ? 'is-active' : ''}`} onClick={() => setRoom('sala1')}>Sala 1</button>
        <button className={`admin-tab ${room === 'sala2' ? 'is-active' : ''}`} onClick={() => setRoom('sala2')}>Sala 2</button>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3>Mapa de Ocupação — {room === 'sala1' ? 'Sala 1' : 'Sala 2'}</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn--outline" onClick={() => setShowPreview(true)}>
              <Eye size={18} /> Visualizar / Imprimir
            </button>
            <button className="btn btn--primary" onClick={saveAgenda} disabled={saving || loading}>
              {saving ? 'A Sincronizar...' : <><Save size={18} /> Sincronizar Mapa</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
        ) : (
          <div className="agenda-grid">
            {DAYS.map(day => (
              <div key={day} className="agenda-day">
                <div className="agenda-day-header">{day}</div>
                {day === 'Sábado' ? (
                  <div className="agenda-slot agenda-slot--full">
                    <label>Dia Inteiro (09h-18h)</label>
                    <AgendaSlotInputs 
                      day={day} slot="full" agenda={agenda} 
                      trainers={getAvailableTrainers(day, 'full')} 
                      onUpdate={updateSlot} getCourses={getTrainerCourses}
                    />
                  </div>
                ) : (
                  SLOTS.map(slot => (
                    <div key={slot} className="agenda-slot">
                      <label>{slot}</label>
                      <AgendaSlotInputs 
                        day={day} slot={slot} agenda={agenda} 
                        trainers={getAvailableTrainers(day, slot)} 
                        onUpdate={updateSlot} getCourses={getTrainerCourses}
                      />
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <AgendaPreviewModal agenda={agenda} room={room} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AgendaSlotInputs({ day, slot, agenda, trainers, onUpdate, getCourses }: any) {
  const key = `${day}-${slot}`;
  const currentTrainer = agenda[key]?.trainer || '';
  const currentCourse = agenda[key]?.course || '';
  const availableCourses = getCourses(currentTrainer);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <select className="agenda-select" value={currentTrainer} onChange={e => onUpdate(day, slot, 'trainer', e.target.value)}>
        <option value="">— Formador —</option>
        {trainers.map((f: any) => (<option key={f[1]} value={f[1]}>{f[1]}</option>))}
      </select>
      <select className="agenda-select" value={currentCourse} onChange={e => onUpdate(day, slot, 'course', e.target.value)} disabled={!currentTrainer}>
        <option value="">— Curso —</option>
        {availableCourses.map((c: string) => (<option key={c} value={c}>{c}</option>))}
      </select>
    </div>
  );
}

function AgendaPreviewModal({ agenda, room, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Agenda_${room === 'sala1' ? 'Sala1' : 'Sala2'}_FaroForma.pdf`);
    } catch (err) {
      alert('Erro ao gerar PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal admin-modal--large glass" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
        <div className="admin-modal-header">
          <h3>Pré-visualização do Documento</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        
        <div className="admin-modal-body" style={{ background: '#f0f0f0', padding: '3rem' }}>
          {/* Paper Sheet */}
          <div ref={printRef} className="print-sheet">
            <div className="print-header">
              <div className="print-logo">FaroForma</div>
              <div className="print-title">Mapa de Ocupação — {room === 'sala1' ? 'Sala 1' : 'Sala 2'}</div>
              <div className="print-date">Gerado em: {new Date().toLocaleDateString()}</div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Manhã (09h-13h)</th>
                  <th>Tarde (13h-18h)</th>
                  <th>Noite (18h-21h)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td className="print-day-cell">{day}</td>
                    {day === 'Sábado' ? (
                      <td colSpan={3} className="print-full-cell">
                        <div className="print-entry">
                          <strong>{agenda[`${day}-full`]?.trainer || 'Livre'}</strong>
                          <span>{agenda[`${day}-full`]?.course || ''}</span>
                        </div>
                      </td>
                    ) : (
                      SLOTS.map(slot => (
                        <td key={slot}>
                          <div className="print-entry">
                            <strong>{agenda[`${day}-${slot}`]?.trainer || 'Livre'}</strong>
                            <span>{agenda[`${day}-${slot}`]?.course || ''}</span>
                          </div>
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="print-footer">Documento Oficial FaroForma — © {new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Fechar</button>
          <button className="btn btn--outline" onClick={handlePrint}>
            <Printer size={18} /> Imprimir
          </button>
          <button className="btn btn--primary" onClick={handleDownloadPDF} disabled={generating}>
            {generating ? 'A gerar PDF...' : <><FileDown size={18} /> Guardar PDF</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
