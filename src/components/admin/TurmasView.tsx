import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { A } from '../../config/sheetsSchema';

interface TurmasViewProps {
  courses: any[];
  alunosData: any[][];
  onSaveCourse: (course: any) => Promise<void>;
}

export function TurmasView({ courses: initialCourses, alunosData, onSaveCourse }: TurmasViewProps) {
  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const alunos = alunosData.slice(1);

  const getEnrolled = (courseTitlePt: string, turmaPt: string) =>
    alunos.filter(r => r[A.PROGRAMA] === courseTitlePt && r[A.TURMA] === turmaPt);

  const handleCapacityBlur = async (courseId: string, slotIdx: number, rawVal: string) => {
    const capacity = rawVal.trim() === '' ? undefined : Number(rawVal);
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedSchedule = [...(course.schedule || [])];
    updatedSchedule[slotIdx] = { ...updatedSchedule[slotIdx], capacity };
    const updatedCourse = { ...course, schedule: updatedSchedule };

    setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
    setSaving(`${courseId}-${slotIdx}`);
    try {
      await onSaveCourse(updatedCourse);
      toast.success('Vagas guardadas');
    } catch {
      toast.error('Erro ao guardar vagas');
      setCourses(initialCourses);
    } finally {
      setSaving(null);
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
    XLSX.writeFile(wb, `${courseTitlePt}_${turmaPt}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleExpand = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

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
            {/* Course header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>{titlePt}</span>
                <span style={{ marginLeft: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-2)', padding: '2px 8px', borderRadius: '4px' }}>
                  {totalEnrolled} inscritos
                </span>
              </div>
            </div>

            {/* Turma rows */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-2)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.6rem 1.5rem', textAlign: 'left' }}>Turma</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Período / Horário</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Dias</th>
                  <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: 100 }}>Vagas</th>
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
                  const isSaving = saving === key;

                  const periodoLabel = (() => {
                    const p = slot.periodo || '';
                    if (p === 'manha') return 'Manhã';
                    if (p === 'tarde') return 'Tarde';
                    if (p === 'noite') return 'Noite';
                    if (p === 'sabado') return 'Sábado';
                    return p;
                  })();
                  const horario = Array.isArray(slot.horario) ? slot.horario.join(', ') : (slot.horario || '');
                  const dias = Array.isArray(slot.dias) ? slot.dias.join(', ') : (slot.dias || '');

                  return (
                    <>
                      <tr key={key} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                          <button
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: '0.85rem', padding: 0 }}
                            onClick={() => toggleExpand(key)}
                            title="Ver alunos inscritos"
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            {turmaPt}
                            {isFull && <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>COMPLETA</span>}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-muted)' }}>
                          {periodoLabel}{horario ? ` · ${horario}` : ''}
                        </td>
                        <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{dias}</td>
                        <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            defaultValue={capacity ?? ''}
                            placeholder="∞"
                            onBlur={e => handleCapacityBlur(course.id, slotIdx, e.target.value)}
                            style={{ width: 60, textAlign: 'center', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', fontSize: '0.82rem', color: 'var(--text)', outline: 'none' }}
                            title={isSaving ? 'A guardar...' : 'Vagas máximas (deixar vazio = ilimitado)'}
                          />
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
                            onClick={() => handleExport(titlePt, turmaPt)}
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
                                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{r[A.TELEFONE] || '—'}</td>
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
    </div>
  );
}
