import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Pencil, X, Save, Search, 
  Clock, MessageCircle, Users, Target, 
  Check, Plus, Trash2, Layers, Monitor, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';

const PERIODS = [
  { id: 'manha', pt: 'Manhã', en: 'Morning', slots: ['09:00 – 12:00', '09:00 – 13:00', '10:00 – 13:00'] },
  { id: 'tarde', pt: 'Tarde', en: 'Afternoon', slots: ['14:00 – 17:00', '14:00 – 18:00', '15:00 – 18:00'] },
  { id: 'noite', pt: 'Noite', en: 'Evening', slots: ['18:00 – 21:00', '19:00 – 22:00', '20:00 – 22:00'] },
  { id: 'sabado', pt: 'Sábado', en: 'Saturday', slots: ['09:00 – 13:00', '14:00 – 18:00', '09:00 – 18:00 (Intensivo)'] },
];

const WEEKDAYS = [
  { id: '2-6', pt: '2ª a 6ª feira', en: 'Mon to Fri' },
  { id: '246', pt: '2ª, 4ª e 6ª feira', en: 'Mon, Wed, Fri' },
  { id: '35', pt: '3ª e 5ª feira', en: 'Tue & Thu' },
  { id: 'sab', pt: 'Sábado', en: 'Saturday' },
];

const ICONS = [
  { id: 'MessageCircle', icon: MessageCircle, label: 'Conversa' },
  { id: 'Users', icon: Users, label: 'Pessoas' },
  { id: 'Award', icon: Award, label: 'Prémio' },
  { id: 'Target', icon: Target, label: 'Foco' },
  { id: 'Clock', icon: Clock, label: 'Relógio' },
  { id: 'Layers', icon: Layers, label: 'Níveis' },
  { id: 'Monitor', icon: Monitor, label: 'Digital' },
];

export function CoursesView() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiService.getAdminCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar cursos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (course: any) => {
    try {
      await apiService.saveCourse(course);
      toast.success('Curso guardado!');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      toast.error('Erro ao guardar curso');
    }
  };

  const handleDelete = (id: string, title: string) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Remover curso?</span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>"{title}"</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try { await apiService.deleteCourse(id); fetchCourses(); }
            catch { toast.error('Erro ao remover curso'); }
          }} style={{ padding: '4px 12px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Remover</button>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity, icon: '🗑️' });
  };

  if (loading) return <div className="glass" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>;

  const defaultHighlights = [
    { icon: 'MessageCircle', text: { pt: '', en: '' } },
    { icon: 'Users', text: { pt: '', en: '' } },
    { icon: 'Award', text: { pt: '', en: '' } },
  ];

  return (
    <div className="admin-courses-view">
      <div className="admin-header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Award size={24} className="text-accent" />
          <h3 style={{ margin: 0 }}>Gestão de Cursos</h3>
        </div>
        <button className="btn btn--primary" onClick={() => setEditingCourse({ 
          title: { pt: '', en: '' }, 
          subtitle: { pt: '', en: '' }, 
          status: { pt: '', en: '' }, 
          description: { pt: '', en: '' }, 
          highlights: defaultHighlights, 
          schedule: [] 
        })}>
          <Plus size={18} /> Novo Curso
        </button>
      </div>

      <div className="admin-table-container glass">
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form__input"
              placeholder="Pesquisar cursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.85rem' }}
            />
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {courses.filter(c => !search || c.title?.pt?.toLowerCase().includes(search.toLowerCase()) || c.title?.en?.toLowerCase().includes(search.toLowerCase())).length} curso(s)
          </span>
        </div>
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
              {courses
                .filter(c => !search || c.title?.pt?.toLowerCase().includes(search.toLowerCase()) || c.title?.en?.toLowerCase().includes(search.toLowerCase()))
                .map((course) => (
                <tr key={course.id}>
                  <td style={{ fontWeight: 600 }}>{course.title?.pt}</td>
                  <td>
                    <span className="status-badge">{course.status?.pt || 'Sem estado'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="admin-action-btn" onClick={() => setEditingCourse(course)} title="Editar"><Pencil size={16} /></button>
                      <button className="admin-action-btn" onClick={() => handleDelete(course.id, course.title?.pt || '')} title="Remover" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
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
            key={editingCourse.id || 'new-course'}
            course={editingCourse} 
            onClose={() => setEditingCourse(null)} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }
        .highlight-card-edit { background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; }
        .icon-grid { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .icon-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-1); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); }
        .icon-btn.is-active { border-color: var(--accent); color: var(--accent); background: rgba(var(--accent-rgb), 0.05); }
        .schedule-row-edit { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; position: relative; }
        .remove-row-btn { position: absolute; top: 1rem; right: 1rem; color: #ef4444; background: none; border: none; cursor: pointer; }
        .multi-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
        .check-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.75rem; border-radius: 6px; background: var(--bg-2); border: 1px solid var(--border); }
        .check-item.is-active { border-color: var(--accent); background: rgba(var(--accent-rgb), 0.02); color: var(--accent); }
      `}</style>
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
    highlights: course.highlights?.length === 3 ? course.highlights : [
      { icon: 'MessageCircle', text: { pt: '', en: '' } },
      { icon: 'Users', text: { pt: '', en: '' } },
      { icon: 'Award', text: { pt: '', en: '' } },
    ],
    schedule: course.schedule || []
  });

  const addScheduleRow = () => {
    setData({
      ...data,
      schedule: [...data.schedule, { 
        turma: { pt: '', en: '' }, 
        periodo: 'manha', 
        horario: [], 
        dias: [], 
        diasExtra: { pt: '', en: '' } 
      }]
    });
  };

  const updateSchedule = (idx: number, field: string, val: any) => {
    const ns = [...data.schedule];
    ns[idx] = { ...ns[idx], [field]: val };
    setData({ ...data, schedule: ns });
  };

  const toggleMulti = (idx: number, field: 'horario' | 'dias', val: string) => {
    const ns = [...data.schedule];
    const current = ns[idx][field] || [];
    const next = current.includes(val) ? current.filter((v: string) => v !== val) : [...current, val];
    ns[idx][field] = next;
    setData({ ...data, schedule: ns });
  };

  const updateHighlight = (idx: number, field: string, val: any) => {
    const nh = [...data.highlights];
    if (field === 'icon') nh[idx].icon = val;
    else nh[idx].text = { ...nh[idx].text, [field]: val };
    setData({ ...data, highlights: nh });
  };

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal admin-modal--large glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="admin-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-card-icon emerald" style={{ width: 32, height: 32 }}><Award size={16} /></div>
            <h3>{data.id ? 'Editar Curso' : 'Novo Curso'}</h3>
          </div>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        
        <div className="admin-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* SECÇÃO 1: Info Base */}
          <div className="dm-section">
            <span className="dm-section-label">Informação Base</span>
            <div className="form__grid" style={{ marginTop: '1rem' }}>
              <div className="form__group"><label className="form__label">Título</label><input className="form__input" value={data.title.pt} onChange={e => setData({...data, title: {...data.title, pt: e.target.value}})} /></div>
              <div className="form__group"><label className="form__label">Subtítulo</label><input className="form__input" value={data.subtitle.pt} onChange={e => setData({...data, subtitle: {...data.subtitle, pt: e.target.value}})} /></div>
              <div className="form__group form__group--full"><label className="form__label">Estado/Badge</label><input className="form__input" value={data.status.pt} onChange={e => setData({...data, status: {...data.status, pt: e.target.value}})} placeholder="Ex: Inscrições Abertas" /></div>
              <div className="form__group form__group--full"><label className="form__label">Descrição</label><textarea className="form__textarea" value={data.description.pt} onChange={e => setData({...data, description: {...data.description, pt: e.target.value}})} rows={2} /></div>
            </div>
          </div>

          {/* SECÇÃO 2: Destaques (3 Cartões) */}
          <div className="dm-section" style={{ marginTop: '2rem' }}>
            <span className="dm-section-label">Destaques do Curso (3 Cartões)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {data.highlights.map((h: any, i: number) => (
                <div key={i} className="highlight-card-edit">
                  <div className="icon-grid">
                    {ICONS.map(({ id, icon: Icon }) => (
                      <button key={id} className={`icon-btn ${h.icon === id ? 'is-active' : ''}`} onClick={() => updateHighlight(i, 'icon', id)} title={id}><Icon size={14} /></button>
                    ))}
                  </div>
                  <div className="form__group">
                    <label className="form__label" style={{ fontSize: '0.65rem' }}>Texto do Destaque</label>
                    <input className="form__input" value={h.text.pt} onChange={e => updateHighlight(i, 'pt', e.target.value)} style={{ padding: '0.4rem', fontSize: '0.75rem' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECÇÃO 3: Horários */}
          <div className="dm-section" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="dm-section-label" style={{ border: 'none', padding: 0 }}>Horários e Turmas</span>
              <button className="btn btn--outline btn--small" onClick={addScheduleRow}><Plus size={14} /> Adicionar Turma</button>
            </div>

            {data.schedule.length === 0 && (
              <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clique em adicionar para definir os horários.</div>
            )}

            {data.schedule.map((s: any, i: number) => (
              <div key={i} className="schedule-row-edit">
                <button className="remove-row-btn" onClick={() => setData({...data, schedule: data.schedule.filter((_: any, idx: number) => idx !== i)})}><X size={18} /></button>
                
                <div className="form__grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="form__group">
                    <label className="form__label">Nome da Turma</label>
                    <input className="form__input" value={s.turma?.pt} onChange={e => updateSchedule(i, 'turma', { pt: e.target.value, en: '' })} placeholder="Ex: Turma A" />
                  </div>
                  <div className="form__group">
                    <label className="form__label">Período</label>
                    <select className="form__input" value={s.periodo} onChange={e => updateSchedule(i, 'periodo', e.target.value)}>
                      {PERIODS.map(p => <option key={p.id} value={p.id}>{p.pt}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label className="form__label">Horários Disponíveis (Confirme um ou vários)</label>
                  <div className="multi-select-grid">
                    {PERIODS.find(p => p.id === s.periodo)?.slots.map(slot => (
                      <div key={slot} className={`check-item ${s.horario?.includes(slot) ? 'is-active' : ''}`} onClick={() => toggleMulti(i, 'horario', slot)}>
                        {s.horario?.includes(slot) ? <Check size={14} /> : <div style={{ width: 14 }} />}
                        <span>{slot}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label className="form__label">Dias da Semana</label>
                  <div className="multi-select-grid">
                    {WEEKDAYS.map(d => (
                      <div key={d.id} className={`check-item ${s.dias?.includes(d.pt) ? 'is-active' : ''}`} onClick={() => toggleMulti(i, 'dias', d.pt)}>
                        {s.dias?.includes(d.pt) ? <Check size={14} /> : <div style={{ width: 14 }} />}
                        <span>{d.pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form__group" style={{ marginTop: '1rem' }}>
                  <label className="form__label">Extra/Obs Dias</label>
                  <input className="form__input" value={s.diasExtra?.pt} onChange={e => updateSchedule(i, 'diasExtra', { pt: e.target.value, en: '' })} placeholder="Ex: Exceto feriados" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Info size={14} /> Dados guardados automaticamente no Firestore
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={() => onSave(data)} disabled={!data.title?.pt?.trim()}><Save size={18} /> Guardar Curso</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
