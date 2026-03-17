import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Pencil, X, Save, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';

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

  return (
    <div className="admin-courses-view">
      <div className="admin-header-actions" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Gestão de Cursos</h3>
        <button className="btn btn--primary" onClick={() => setEditingCourse({ title: { pt: '', en: '' }, subtitle: { pt: '', en: '' }, status: { pt: '', en: '' }, description: { pt: '', en: '' }, highlights: [], schedule: [] })}>
          <Award size={18} /> Adicionar Novo Curso
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
                  <td>{course.status?.pt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="admin-action-btn" onClick={() => setEditingCourse(course)} title="Editar"><Pencil size={16} /></button>
                      <button className="admin-action-btn" onClick={() => handleDelete(course.id, course.title?.pt || '')} title="Remover" style={{ color: '#ef4444' }}><X size={16} /></button>
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
          <button className="btn btn--primary" onClick={() => onSave(data)} disabled={!data.title?.pt?.trim()}><Save size={18} /> Guardar Curso</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
