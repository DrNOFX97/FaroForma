import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, Calendar, Hash, Linkedin, BookOpen, Award, Clock, Monitor, Layers, Star } from 'lucide-react';

/* ── Formador field map ─────────────────────────────────────────────────── */
const SECTIONS = [
  {
    label: 'Contacto',
    fields: [
      { idx: 2, label: 'Email',             icon: Mail },
      { idx: 3, label: 'Telefone',          icon: Phone },
      { idx: 10, label: 'LinkedIn',         icon: Linkedin },
      { idx: 5, label: 'NIF',               icon: Hash },
      { idx: 4, label: 'Data de Nascimento',icon: Calendar },
    ],
  },
  {
    label: 'Disponibilidade',
    fields: [
      { idx: 11, label: 'Dias Disponíveis', icon: Calendar },
      { idx: 12, label: 'Períodos',         icon: Clock },
      { idx: 13, label: 'Modalidade',       icon: Monitor },
    ],
  },
  {
    label: 'Qualificações',
    fields: [
      { idx: 6,  label: 'Áreas',            icon: Layers },
      { idx: 7,  label: 'Habilitações',     icon: BookOpen },
      { idx: 8,  label: 'CAP / CCP',        icon: Award },
      { idx: 9,  label: 'Experiência',      icon: Star },
    ],
  },
];

/* ── Generic label map for non-formador rows ───────────────────────────── */
const GENERIC_LABELS: Record<string, string> = {
  fullName: 'Nome', name: 'Nome', email: 'Email', phone: 'Telefone',
  program: 'Programa', turma: 'Turma', startDate: 'Data Início',
  contactPreference: 'Contacto Preferido', needsTransport: 'Transporte',
  notes: 'Notas', cells: 'Dados',
};

interface DetailModalProps {
  data: any;
  onClose: () => void;
}

export function DetailModal({ data, onClose }: DetailModalProps) {
  const isFormador = Array.isArray(data.cells);
  const modalRef = useRef<HTMLDivElement>(null);

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
            <div className="dm-avatar">
              {isFormador ? (data.cells[1]?.[0] ?? '?') : (data.fullName?.[0] ?? data.name?.[0] ?? '?')}
            </div>
            <div>
              <h3 id="dm-title" className="dm-name">
                {isFormador ? data.cells[1] : (data.fullName || data.name || 'Registo')}
              </h3>
              <span className="dm-meta">
                {isFormador
                  ? `Candidatura #${data.originalIndex} · ${data.cells[0] ? new Date(data.cells[0]).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}`
                  : `Registo #${data.originalIndex}`}
              </span>
            </div>
          </div>
          <button className="dm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="dm-body">
          {isFormador ? (
            <>
              {SECTIONS.map(section => {
                const visible = section.fields.filter(f => data.cells[f.idx]);
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
                            <span className="dm-field-value">{data.cells[idx]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Motivação full-width */}
              {data.cells[14] && (
                <div className="dm-section">
                  <span className="dm-section-label">Motivação</span>
                  <div className="dm-textarea-value">{data.cells[14]}</div>
                </div>
              )}
            </>
          ) : (
            <div className="dm-section">
              <div className="dm-fields">
                {Object.entries(data)
                  .filter(([key]) => key !== 'originalIndex' && key !== 'cells')
                  .map(([key, val]: [string, any]) => (
                    <div key={key} className="dm-field">
                      <div className="dm-field-content">
                        <span className="dm-field-label">{GENERIC_LABELS[key] ?? key}</span>
                        <span className="dm-field-value">
                          {typeof val === 'boolean'
                            ? (val ? 'Sim' : 'Não')
                            : typeof val === 'string' || typeof val === 'number'
                              ? val || '—'
                              : <pre style={{ margin: 0, fontSize: '0.8em' }}>{JSON.stringify(val, null, 2)}</pre>}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
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
