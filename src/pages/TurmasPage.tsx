import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import AnimatedSection from '../components/ui/AnimatedSection';

const turmaKey = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const CONTACT_PREFERENCES = ['Telefone', 'Email', 'WhatsApp'];

interface InscricaoModal {
  course: any;
  slot: any;
  isFull: boolean;
}

export default function TurmasPage({ onNavigate: _onNavigate }: { onNavigate: (page: any) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<InscricaoModal | null>(null);

  useEffect(() => {
    apiService.getCourses()
      .then(data => setCourses(data || []))
      .catch(() => toast.error('Erro ao carregar turmas'))
      .finally(() => setLoading(false));
  }, []);

  const coursesWithSchedule = courses.filter(
    c => Array.isArray(c.schedule) && c.schedule.length > 0
  );

  return (
    <>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--bg-1) 0%, var(--bg) 100%)', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', padding: '0.4rem 1rem', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            <Users size={14} /> Turmas Disponíveis
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1rem' }}>
            Escolha a sua <span className="gradient-text">turma</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
            Vagas em tempo real. Inscreva-se diretamente na turma que melhor se adequa ao seu horário.
          </p>
        </motion.div>
      </section>

      {/* Courses + Turmas */}
      <section style={{ padding: '3rem 2rem 6rem', maxWidth: 900, margin: '0 auto' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && coursesWithSchedule.length === 0 && (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>
            Não há turmas disponíveis de momento. Consulte-nos através do formulário de contacto.
          </div>
        )}

        {coursesWithSchedule.map((course, ci) => {
          const titlePt = typeof course.title === 'string' ? course.title : (course.title?.pt || '—');

          return (
            <div key={course.id} style={{ marginBottom: '2.5rem' }}>
            <AnimatedSection delay={ci * 0.1}>
              <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Course header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(var(--accent-rgb),0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 4 }}>
                      Curso
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{titlePt}</span>
                  </div>
                  {course.subtitle?.pt && (
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.subtitle.pt}</p>
                  )}
                </div>

                {/* Turma slots */}
                {course.schedule.map((slot: any, si: number) => {
                  const turmaPt = slot.turma?.pt || slot.turma || `Turma ${si + 1}`;
                  const capacity = typeof slot.capacity === 'number' ? slot.capacity : null;
                  const enrolled = course.enrolledCounts?.[turmaKey(turmaPt)] ?? 0;
                  const available = capacity !== null ? Math.max(0, capacity - enrolled) : null;
                  const isFull = capacity !== null && enrolled >= capacity;
                  const pct = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
                  const barColor = pct < 50 ? '#10b981' : pct < 90 ? '#f59e0b' : '#ef4444';

                  const periodoLabel = (() => {
                    const p = slot.periodo || '';
                    if (p === 'manha') return 'Manhã';
                    if (p === 'tarde') return 'Tarde';
                    if (p === 'noite') return 'Noite';
                    if (p === 'sabado') return 'Sábado';
                    return p;
                  })();
                  const horario = Array.isArray(slot.horario) ? slot.horario.join(' / ') : (slot.horario || '');
                  const dias = Array.isArray(slot.dias) ? slot.dias.join(', ') : (slot.dias || '');

                  return (
                    <div key={si} style={{ padding: '1.25rem 1.5rem', borderBottom: si < course.schedule.length - 1 ? '1px solid var(--border)' : undefined, display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {/* Turma info */}
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {turmaPt}
                          {isFull && <span style={{ fontSize: '0.6rem', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>COMPLETA</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {periodoLabel && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={11} /> {periodoLabel}{horario ? ` · ${horario}` : ''}
                            </span>
                          )}
                          {dias && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Calendar size={11} /> {dias}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                        {capacity !== null ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                              <span>{isFull ? 'Turma completa' : `${available} vaga${available !== 1 ? 's' : ''} disponíve${available !== 1 ? 'is' : 'l'}`}</span>
                              <span>{enrolled}/{capacity}</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.6s' }} />
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Vagas disponíveis</span>
                        )}
                      </div>

                      {/* CTA */}
                      <div style={{ flexShrink: 0 }}>
                        {isFull ? (
                          <button
                            className="btn btn--outline btn--sm"
                            onClick={() => setModal({ course, slot, isFull: true })}
                          >
                            Lista de espera
                          </button>
                        ) : (
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => setModal({ course, slot, isFull: false })}
                          >
                            Inscrever →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>
            </div>
          );
        })}
      </section>

      {/* Registration Modal */}
      <AnimatePresence>
        {modal && (
          <InscricaoModal
            modal={modal}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function InscricaoModal({ modal, onClose }: { modal: InscricaoModal; onClose: () => void }) {
  const { course, slot, isFull } = modal;
  const titlePt = typeof course.title === 'string' ? course.title : (course.title?.pt || '');
  const turmaPt = slot.turma?.pt || slot.turma || '';

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    startDate: '',
    contactPreference: CONTACT_PREFERENCES[0],
    needsTransport: false,
    notes: isFull ? 'Lista de espera' : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Nome obrigatório';
    if (!form.email.trim()) e.email = 'Email obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.phone.trim()) e.phone = 'Telefone obrigatório';
    if (!form.startDate.trim()) e.startDate = 'Indique quando pretende iniciar';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiService.submitStudent({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        program: titlePt,
        turma: turmaPt,
        startDate: form.startDate,
        contactPreference: form.contactPreference,
        needsTransport: form.needsTransport,
        notes: form.notes,
      });
      setDone(true);
      toast.success('Inscrição enviada com sucesso!');
    } catch {
      toast.error('Erro ao enviar inscrição. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

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
        style={{ maxWidth: 520 }}
      >
        <div className="admin-modal-header">
          <div>
            <h3 style={{ margin: 0 }}>{isFull ? 'Lista de Espera' : 'Inscrição'}</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {titlePt} · <strong>{turmaPt}</strong>
            </p>
          </div>
          <button className="admin-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {done ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
            <h4 style={{ marginBottom: '0.5rem' }}>{isFull ? 'Adicionado à lista de espera!' : 'Inscrição recebida!'}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Receberá um email de confirmação em breve. Entraremos em contacto através do seu meio preferido.
            </p>
            <button className="btn btn--primary" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="admin-modal-body">
              {isFull && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#b45309' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Esta turma está completa. Pode ficar na lista de espera e será contactado se abrir uma vaga.</span>
                </div>
              )}

              <div className="form__grid">
                <div className="form__group form__group--full">
                  <label className="form__label">Nome completo *</label>
                  <input className={`form__input${errors.fullName ? ' form__input--error' : ''}`} value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="O seu nome" />
                  {errors.fullName && <span className="form__error">{errors.fullName}</span>}
                </div>
                <div className="form__group">
                  <label className="form__label">Email *</label>
                  <input className={`form__input${errors.email ? ' form__input--error' : ''}`} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                  {errors.email && <span className="form__error">{errors.email}</span>}
                </div>
                <div className="form__group">
                  <label className="form__label">Telefone *</label>
                  <input className={`form__input${errors.phone ? ' form__input--error' : ''}`} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9xx xxx xxx" />
                  {errors.phone && <span className="form__error">{errors.phone}</span>}
                </div>
                <div className="form__group">
                  <label className="form__label">Quando pretende iniciar *</label>
                  <input className={`form__input${errors.startDate ? ' form__input--error' : ''}`} value={form.startDate} onChange={e => set('startDate', e.target.value)} placeholder="Ex: Imediatamente, Janeiro 2026…" />
                  {errors.startDate && <span className="form__error">{errors.startDate}</span>}
                </div>
                <div className="form__group">
                  <label className="form__label">Preferência de contacto</label>
                  <select className="form__input" value={form.contactPreference} onChange={e => set('contactPreference', e.target.value)}>
                    {CONTACT_PREFERENCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="form__group form__group--full">
                  <label className="form__label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.needsTransport} onChange={e => set('needsTransport', e.target.checked)} style={{ width: 'auto' }} />
                    Preciso de transporte (+2,50 €/viagem/dia)
                  </label>
                </div>

                <div className="form__group form__group--full">
                  <label className="form__label">Notas / Observações</label>
                  <textarea className="form__textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Informação adicional relevante..." />
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'A enviar…' : isFull ? 'Entrar na lista de espera' : 'Confirmar inscrição'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
