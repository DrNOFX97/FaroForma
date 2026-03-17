import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Calendar, Hash, Linkedin, BookOpen, Award, Clock, Monitor, Layers, Star, MessageSquare, GraduationCap, User } from 'lucide-react';
import { F, A, C } from '../../config/sheetsSchema';

/* ── Formador sections ──────────────────────────────────────────────────── */
const F_SECTIONS = [
  {
    label: 'Contacto',
    fields: [
      { idx: F.EMAIL,           label: 'Email',              icon: Mail },
      { idx: F.TELEFONE,        label: 'Telefone',           icon: Phone },
      { idx: F.LINKEDIN,        label: 'LinkedIn',           icon: Linkedin },
      { idx: F.NIF,             label: 'NIF',                icon: Hash },
      { idx: F.DATA_NASCIMENTO, label: 'Data de Nascimento', icon: Calendar },
      { idx: F.EMAIL_CONF,      label: 'Email Confirmado',   icon: Mail },
    ],
  },
  {
    label: 'Disponibilidade',
    fields: [
      { idx: F.DIAS,      label: 'Dias Disponíveis', icon: Calendar },
      { idx: F.PERIODOS,  label: 'Períodos',         icon: Clock },
      { idx: F.MODALIDADE,label: 'Modalidade',       icon: Monitor },
    ],
  },
  {
    label: 'Qualificações',
    fields: [
      { idx: F.AREAS,      label: 'Áreas',       icon: Layers },
      { idx: F.HABILITACOES,label: 'Habilitações',icon: BookOpen },
      { idx: F.CAP_CCP,    label: 'CAP / CCP',   icon: Award },
      { idx: F.EXPERIENCIA,label: 'Experiência', icon: Star },
    ],
  },
];

/* ── Aluno sections ─────────────────────────────────────────────────────── */
const A_SECTIONS = [
  {
    label: 'Contacto',
    fields: [
      { idx: A.EMAIL,                label: 'Email',              icon: Mail },
      { idx: A.TELEFONE,             label: 'Telefone',           icon: Phone },
      { idx: A.PREFERENCIA_CONTACTO, label: 'Contacto Preferido', icon: Phone },
      { idx: A.EMAIL_CONF,           label: 'Email Confirmado',   icon: Mail },
    ],
  },
  {
    label: 'Inscrição',
    fields: [
      { idx: A.PROGRAMA,    label: 'Programa',    icon: GraduationCap },
      { idx: A.TURMA,       label: 'Turma',       icon: Layers },
      { idx: A.DATA_INICIO, label: 'Data Início', icon: Calendar },
      { idx: A.TRANSPORTE,  label: 'Transporte',  icon: Monitor },
    ],
  },
];

/* ── Contacto sections ──────────────────────────────────────────────────── */
const C_SECTIONS = [
  {
    label: 'Contacto',
    fields: [
      { idx: C.EMAIL,    label: 'Email',    icon: Mail },
      { idx: C.TELEFONE, label: 'Telefone', icon: Phone },
      { idx: C.ASSUNTO,  label: 'Assunto',  icon: MessageSquare },
    ],
  },
];

interface DetailModalProps {
  data: any;
  onClose: () => void;
}

export function DetailModal({ data, onClose }: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // _type is set by TableView; absent when called from FormadoresTable
  const type: string = data._type || 'formadores';
  const cells: any[] = data.cells || [];

  const sections =
    type === 'alunos'    ? A_SECTIONS :
    type === 'contactos' ? C_SECTIONS :
    F_SECTIONS;

  // Tail field (long text rendered full-width)
  const tailField =
    type === 'alunos'    ? { idx: A.NOTAS,      label: 'Notas' } :
    type === 'contactos' ? { idx: C.MENSAGEM,   label: 'Mensagem' } :
    { idx: F.MOTIVACAO, label: 'Motivação' };

  const typeLabel =
    type === 'alunos'    ? 'Aluno'    :
    type === 'contactos' ? 'Contacto' :
    'Candidatura';

  const typeIcon =
    type === 'alunos'    ? <GraduationCap size={18} /> :
    type === 'contactos' ? <MessageSquare size={18} /> :
    <User size={18} />;

  useEffect(() => {
    modalRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      className="dm-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        className="dm-card glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dm-title"
        tabIndex={-1}
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dm-header">
          <div className="dm-header-info">
            <div className="dm-avatar">{cells[1]?.[0] ?? '?'}</div>
            <div>
              <h3 id="dm-title" className="dm-name">{cells[1] || 'Registo'}</h3>
              <span className="dm-meta">
                {typeLabel} #{data.originalIndex}
                {cells[0] ? ` · ${new Date(cells[0]).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`dm-type-badge ${type}`}>{typeIcon}{typeLabel}</span>
            <button className="dm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="dm-body">
          {sections.map(section => {
            const visible = section.fields.filter(f => cells[f.idx]);
            if (!visible.length) return null;
            return (
              <div key={section.label} className="dm-section">
                <span className="dm-section-label">{section.label}</span>
                <div className="dm-fields">
                  {visible.map(({ idx, label, icon: Icon }) => (
                    <div key={idx} className="dm-field">
                      <Icon size={14} className="dm-field-icon" />
                      <div className="dm-field-content">
                        <span className="dm-field-label">{label}</span>
                        <span className="dm-field-value">{cells[idx]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Long-text tail field */}
          {cells[tailField.idx] && (
            <div className="dm-section">
              <span className="dm-section-label">{tailField.label}</span>
              <div className="dm-textarea-value">{cells[tailField.idx]}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dm-footer">
          <button className="btn btn--primary" onClick={onClose}>Fechar</button>
        </div>
      </motion.div>

      <style>{DM_STYLES}</style>
    </motion.div>
  );
}

const DM_STYLES = `
  .dm-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .dm-card {
    width: 100%; max-width: 560px; max-height: 88vh;
    border-radius: 20px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    outline: none;
  }

  /* Header */
  .dm-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
    background: var(--bg-2); flex-shrink: 0;
  }
  .dm-header-info { display: flex; align-items: center; gap: 1rem; }
  .dm-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #059669);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 800; color: #fff; flex-shrink: 0;
    text-transform: uppercase;
  }
  .dm-name { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text); }
  .dm-meta { font-size: 0.75rem; color: var(--text-muted); }

  .dm-type-badge {
    display: flex; align-items: center; gap: 0.35rem;
    font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; padding: 3px 9px; border-radius: 20px;
  }
  .dm-type-badge.formadores { background: rgba(16,185,129,0.12); color: #10b981; }
  .dm-type-badge.alunos     { background: rgba(59,130,246,0.12); color: #3b82f6; }
  .dm-type-badge.contactos  { background: rgba(139,92,246,0.12); color: #8b5cf6; }

  .dm-close {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: var(--bg); color: var(--text-muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; flex-shrink: 0;
  }
  .dm-close:hover { background: rgba(239,68,68,0.12); color: #ef4444; }

  /* Body */
  .dm-body {
    padding: 1.25rem 1.5rem; overflow-y: auto; flex: 1;
    display: flex; flex-direction: column; gap: 1.25rem;
  }
  .dm-section { display: flex; flex-direction: column; gap: 0.6rem; }
  .dm-section-label {
    font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--accent);
    padding-bottom: 0.35rem; border-bottom: 1px solid var(--border);
  }
  .dm-fields { display: flex; flex-direction: column; gap: 0.1rem; }
  .dm-field {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 0.55rem 0.75rem; border-radius: 8px;
    transition: background 0.15s;
  }
  .dm-field:hover { background: var(--bg-2); }
  .dm-field-icon { color: var(--text-dim); margin-top: 2px; flex-shrink: 0; }
  .dm-field-content { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
  .dm-field-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-dim); }
  .dm-field-value { font-size: 0.88rem; color: var(--text); line-height: 1.45; word-break: break-word; }

  .dm-textarea-value {
    font-size: 0.875rem; color: var(--text-muted); line-height: 1.6;
    background: var(--bg-2); border-radius: 10px; padding: 0.875rem 1rem;
    border: 1px solid var(--border); white-space: pre-wrap;
  }

  /* Footer */
  .dm-footer {
    padding: 1rem 1.5rem; border-top: 1px solid var(--border);
    background: var(--bg-2); display: flex; justify-content: flex-end;
    flex-shrink: 0;
  }
`;
