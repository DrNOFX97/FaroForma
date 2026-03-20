import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, Download, X, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { A } from '../../config/sheetsSchema';

interface TurmasViewProps {
  courses: any[];
  alunosData: any[][];
  onSaveCourse: (course: any) => Promise<void>;
}

interface EditingSlot {
  courseId: string;
  slotIdx: number;
  slot: any;
}

const PERIODS = [
  { id: 'manha', pt: 'Manhã' },
  { id: 'tarde', pt: 'Tarde' },
  { id: 'noite', pt: 'Noite' },
  { id: 'sabado', pt: 'Sábado' },
];

const PERIOD_SLOTS: Record<string, string[]> = {
  manha: ['09:00 – 12:00', '09:00 – 13:00', '10:00 – 13:00'],
  tarde: ['14:00 – 17:00', '14:00 – 18:00', '15:00 – 18:00'],
  noite: ['18:00 – 21:00', '19:00 – 22:00', '20:00 – 22:00'],
  sabado: ['09:00 – 13:00', '14:00 – 18:00', '09:00 – 18:00 (Intensivo)'],
};

const WEEKDAYS = [
  '2ª a 6ª feira', '2ª, 4ª e 6ª feira', '3ª e 5ª feira', 'Sábado',
];

const periodoLabel = (p: string) => {
  if (p === 'manha') return 'Manhã';
  if (p === 'tarde') return 'Tarde';
  if (p === 'noite') return 'Noite';
  if (p === 'sabado') return 'Sábado';
  return p;
};

export function TurmasView({ courses: initialCourses, alunosData, onSaveCourse }: TurmasViewProps) {
  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<EditingSlot | null>(null);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const alunos = alunosData.slice(1);

  const getEnrolled = (courseTitlePt: string, turmaPt: string) =>
    alunos.filter(r => r[A.PROGRAMA] === courseTitlePt && r[A.TURMA] === turmaPt);

  const handleSaveSlot = async (courseId: string, slotIdx: number, updatedSlot: any) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const updatedSchedule = [...(course.schedule || [])];
    updatedSchedule[slotIdx] = updatedSlot;
    const updatedCourse = { ...course, schedule: updatedSchedule };
    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
    try {
      await onSaveCourse(updatedCourse);
      toast.success('Turma guardada');
      setEditing(null);
    } catch {
      toast.error('Erro ao guardar turma');
      setCourses(initialCourses);
    }
  };

  const handleExport = (courseTitlePt: string, turmaPt: string) => {
    const rows = getEnrolled(courseTitlePt, turmaPt);
    const data = rows.map(r => ({
      Nome: r[A.NOME] || '',
      Email: r[A.EMAIL] || '',
      Telefone: r[A.TELEFONE] || '',
      'Data Inscrição': r[A.TIMESTAMP] ? new Date(r[A.TIMESTAMP]).toLocaleDateString('pt-PT') : '',
      Transporte: r[A.TRANSPORTE] || '',
      Notas: r[A.NOTAS] || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, turmaPt.slice(0, 31));
    XLSX.writeFile(wb, `${courseTitlePt}_${turmaPt}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const coursesWithSchedule = courses.filter(c => Array.isArray(c.schedule) && c.schedule.length > 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Users size={24} className="text-accent" />
        <h3 style={{ margin: 0 }}>Gestão de Turmas</h3>
      </div>

      {coursesWithSchedule.length === 0 && (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhum curso com turmas definidas. Configure os horários no separador Cursos.
        </div>
      )}

      {coursesWithSchedule.map(course => {
        const titlePt = typeof course.title === 'string' ? course.title : (course.title?.pt || '—');
        const totalEnrolled = (course.schedule || []).reduce((sum: number, slot: any) => {
          const turmaPt = slot.turma?.pt || slot.turma || '';
          return sum + getEnrolled(titlePt, turmaPt).length;
        }, 0);

        return (
          <div key={course.id} className="glass" style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>{titlePt}</span>
                <span style={{ marginLeft: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-2)', padding: '2px 8px', borderRadius: '4px' }}>
                  {totalEnrolled} inscritos
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clique numa linha para editar</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-2)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.6rem 1.5rem', textAlign: 'left' }}>Turma</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Período / Horário</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Dias</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: 80 }}>Vagas</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: 80 }}>Inscritos</th>
                  <th style={{ padding: '0.6rem 1.5rem', textAlign: 'left', minWidth: 140 }}>Ocupação</th>
                  <th style={{ padding: '0.6rem 1rem', textAlign: 'right', width: 90 }}>Exportar</th>
                </tr>
              </thead>
              <tbody>
                {(course.schedule || []).map((slot: any, slotIdx: number) => {
                  const turmaPt = slot.turma?.pt || slot.turma || `Turma ${slotIdx + 1}`;
                  const key = `${course.id}-${slotIdx}`;
                  const enrolled = getEnrolled(titlePt, turmaPt);
                  const capacity = typeof slot.capacity === 'number' ? slot.capacity : null;
                  const pct = capacity ? Math.min(100, Math.round((enrolled.length / capacity) * 100)) : 0;
                  const barColor = pct < 50 ? '#10b981' : pct < 90 ? '#f59e0b' : '#ef4444';
                  const isFull = capacity !== null && enrolled.length >= capacity;
                  const isExpanded = expanded[key];
                  const _allTimeSlots = new Set(Object.values(PERIOD_SLOTS).flat());
                  const _allWeekdays = new Set(WEEKDAYS);
                  const horario = Array.isArray(slot.horario) ? slot.horario.filter((h: string) => _allTimeSlots.has(h)).join(', ') : (slot.horario || '');
                  const dias = Array.isArray(slot.dias) ? slot.dias.filter((d: string) => _allWeekdays.has(d)).join(', ') : (slot.dias || '');

                  return (
                    <>
                      <tr
                        key={key}
                        style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => setEditing({ courseId: course.id, slotIdx, slot })}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                        title="Clique para editar esta turma"
                      >
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: 4 }}
                              onClick={e => toggleExpand(key, e)}
                              title="Ver alunos inscritos"
                            >
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                            {turmaPt}
                            {isFull && <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>COMPLETA</span>}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-muted)' }}>
                          {periodoLabel(slot.periodo || '')}{horario ? ` · ${horario}` : ''}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{dias}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {capacity ?? '∞'}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', fontWeight: 700, color: enrolled.length > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {enrolled.length}
                        </td>
                        <td style={{ padding: '0.75rem 1.5rem' }}>
                          {capacity !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 8, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{enrolled.length}/{capacity}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ilimitado</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            className="admin-action-btn"
                            onClick={e => { e.stopPropagation(); handleExport(titlePt, turmaPt); }}
                            title="Exportar lista de alunos"
                            disabled={enrolled.length === 0}
                          >
                            <Download size={15} />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${key}-expanded`}>
                          <td colSpan={7} style={{ padding: '0 1.5rem 1rem', background: 'var(--bg-2)' }}>
                            {enrolled.length === 0 ? (
                              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                                Nenhum aluno inscrito nesta turma.
                              </div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                <thead>
                                  <tr style={{ color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Nome</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Telefone</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Inscrição</th>
                                    <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Transporte</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {enrolled.map((r, ri) => (
                                    <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text)' }}>{r[A.NOME] || '—'}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{r[A.EMAIL] || '—'}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{String(r[A.TELEFONE] || '').replace(/\.0$/, '') || '—'}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>
                                        {r[A.TIMESTAMP] ? new Date(r[A.TIMESTAMP]).toLocaleDateString('pt-PT') : '—'}
                                      </td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{r[A.TRANSPORTE] || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <AnimatePresence>
        {editing && (
          <SlotEditModal
            courseId={editing.courseId}
            slotIdx={editing.slotIdx}
            slot={editing.slot}
            onClose={() => setEditing(null)}
            onSave={handleSaveSlot}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotEditModal({ courseId, slotIdx, slot, onClose, onSave }: {
  courseId: string;
  slotIdx: number;
  slot: any;
  onClose: () => void;
  onSave: (courseId: string, slotIdx: number, updatedSlot: any) => Promise<void>;
}) {
  // Sanitize potentially mixed-up horario/dias on load
  const ALL_TIME_SLOTS = new Set(Object.values(PERIOD_SLOTS).flat());
  const ALL_WEEKDAYS = new Set(WEEKDAYS);

  const rawHorario: string[] = Array.isArray(slot.horario) ? slot.horario : (slot.horario ? [String(slot.horario)] : []);
  const rawDias: string[] = Array.isArray(slot.dias) ? slot.dias : (slot.dias ? [String(slot.dias)] : []);

  // Move any weekday strings out of horario into dias, and any time strings out of dias into horario
  const cleanHorario = [...rawHorario.filter(v => ALL_TIME_SLOTS.has(v)), ...rawDias.filter(v => ALL_TIME_SLOTS.has(v))];
  const cleanDias    = [...rawDias.filter(v => ALL_WEEKDAYS.has(v)),    ...rawHorario.filter(v => ALL_WEEKDAYS.has(v))];

  const [form, setForm] = useState({
    turmaPt: slot.turma?.pt || slot.turma || '',
    periodo: slot.periodo || 'manha',
    horario: cleanHorario,
    dias: cleanDias,
    diasExtra: slot.diasExtra?.pt || slot.diasExtra || '',
    capacity: typeof slot.capacity === 'number' ? String(slot.capacity) : '',
  });
  const [saving, setSaving] = useState(false);

  const toggleHorario = (val: string) =>
    setForm(prev => ({
      ...prev,
      horario: prev.horario.includes(val) ? prev.horario.filter((v: string) => v !== val) : [...prev.horario, val],
    }));

  const toggleDia = (val: string) =>
    setForm(prev => ({
      ...prev,
      dias: prev.dias.includes(val) ? prev.dias.filter((v: string) => v !== val) : [...prev.dias, val],
    }));

  const handleSave = async () => {
    if (!form.turmaPt.trim()) return;
    setSaving(true);
    const periodSlots = new Set(PERIOD_SLOTS[form.periodo] || []);
    const updatedSlot = {
      ...slot,
      turma: { pt: form.turmaPt.trim(), en: slot.turma?.en || '' },
      periodo: form.periodo,
      horario: form.horario.filter(h => periodSlots.has(h)),
      dias: form.dias.filter(d => ALL_WEEKDAYS.has(d)),
      diasExtra: { pt: form.diasExtra, en: slot.diasExtra?.en || '' },
      capacity: form.capacity.trim() === '' ? undefined : Number(form.capacity),
    };
    await onSave(courseId, slotIdx, updatedSlot);
    setSaving(false);
  };

  const slots = PERIOD_SLOTS[form.periodo] || [];

  return (
    <motion.div
      className="admin-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="admin-modal glass"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        style={{ maxWidth: 540 }}
      >
        <div className="admin-modal-header">
          <h3 style={{ margin: 0 }}>Editar Turma</h3>
          <button className="admin-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="admin-modal-body">
          <div className="form__grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form__group">
              <label className="form__label">Nome da Turma *</label>
              <input
                className="form__input"
                value={form.turmaPt}
                onChange={e => setForm(prev => ({ ...prev, turmaPt: e.target.value }))}
                placeholder="Ex: Turma A"
              />
            </div>
            <div className="form__group">
              <label className="form__label">Vagas Máximas</label>
              <input
                className="form__input"
                type="number"
                min="1"
                value={form.capacity}
                onChange={e => setForm(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="∞ ilimitado"
              />
            </div>
          </div>

          <div className="form__group" style={{ marginTop: '1rem' }}>
            <label className="form__label">Período</label>
            <select
              className="form__input"
              value={form.periodo}
              onChange={e => setForm(prev => ({ ...prev, periodo: e.target.value, horario: [] }))}
            >
              {PERIODS.map(p => <option key={p.id} value={p.id}>{p.pt}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="form__label">Horários</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {slots.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleHorario(s)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid',
                    borderColor: form.horario.includes(s) ? 'var(--accent)' : 'var(--border)',
                    background: form.horario.includes(s) ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-2)',
                    color: form.horario.includes(s) ? 'var(--accent)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  {form.horario.includes(s) && <Check size={12} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="form__label">Dias da Semana</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
              {WEEKDAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDia(d)}
                  style={{
                    padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid',
                    borderColor: form.dias.includes(d) ? 'var(--accent)' : 'var(--border)',
                    background: form.dias.includes(d) ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-2)',
                    color: form.dias.includes(d) ? 'var(--accent)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  {form.dias.includes(d) && <Check size={12} />}
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="form__group" style={{ marginTop: '1rem' }}>
            <label className="form__label">Extra / Observações Dias</label>
            <input
              className="form__input"
              value={form.diasExtra}
              onChange={e => setForm(prev => ({ ...prev, diasExtra: e.target.value }))}
              placeholder="Ex: Exceto feriados"
            />
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving || !form.turmaPt.trim()}
          >
            <Save size={16} /> {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
