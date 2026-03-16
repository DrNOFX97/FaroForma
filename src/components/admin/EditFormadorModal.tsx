import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { F } from '../../config/sheetsSchema';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';

interface EditFormadorModalProps {
  row: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditFormadorModal({ row, onClose, onSuccess }: EditFormadorModalProps) {
  const [values, setValues] = useState([...row.cells]);
  const [saving, setSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const updateField = (idx: number, val: any) => {
    setValues(prev => prev.map((v, i) => i === idx ? val : v));
  };

  useEffect(() => {
    modalRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateFormador(row.originalIndex, values);
      onSuccess();
    } catch (err) {
      toast.error('Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

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
        aria-labelledby="efm-title"
        tabIndex={-1}
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 600 }}
      >
        {/* Header */}
        <div className="dm-header">
          <div className="dm-header-info">
            <div className="dm-avatar">{values[F.NOME]?.[0] ?? '?'}</div>
            <div>
              <h3 id="efm-title" className="dm-name">Editar Formador</h3>
              <span className="dm-meta">#{row.originalIndex} · {values[F.NOME] || 'Sem nome'}</span>
            </div>
          </div>
          <button className="dm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="dm-body" style={{ gap: '1.5rem' }}>

          <div className="efm-section">
            <span className="dm-section-label">Identificação</span>
            <div className="efm-grid">
              <div className="form__group">
                <label className="form__label">Nome</label>
                <input className="form__input" value={values[F.NOME] ?? ''} onChange={e => updateField(F.NOME, e.target.value)} />
              </div>
              <div className="form__group">
                <label className="form__label">NIF</label>
                <input className="form__input" value={values[F.NIF] ?? ''} onChange={e => updateField(F.NIF, e.target.value)} />
              </div>
              <div className="form__group">
                <label className="form__label">Data de Nascimento</label>
                <input className="form__input" value={values[F.DATA_NASCIMENTO] ?? ''} onChange={e => updateField(F.DATA_NASCIMENTO, e.target.value)} />
              </div>
            </div>
          </div>

          <div className="efm-section">
            <span className="dm-section-label">Contacto</span>
            <div className="efm-grid">
              <div className="form__group efm-col-2">
                <label className="form__label">Email</label>
                <input className="form__input" type="email" value={values[F.EMAIL] ?? ''} onChange={e => updateField(F.EMAIL, e.target.value)} />
              </div>
              <div className="form__group">
                <label className="form__label">Telefone</label>
                <input className="form__input" type="tel" value={values[F.TELEFONE] ?? ''} onChange={e => updateField(F.TELEFONE, e.target.value)} />
              </div>
              <div className="form__group efm-col-2">
                <label className="form__label">LinkedIn</label>
                <input className="form__input" value={values[F.LINKEDIN] ?? ''} onChange={e => updateField(F.LINKEDIN, e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </div>

          <div className="efm-section">
            <span className="dm-section-label">Qualificações</span>
            <div className="efm-grid">
              <div className="form__group efm-col-2">
                <label className="form__label">Áreas de Formação</label>
                <input className="form__input" value={values[F.AREAS] ?? ''} onChange={e => updateField(F.AREAS, e.target.value)} />
              </div>
              <div className="form__group">
                <label className="form__label">Habilitações</label>
                <select className="form__input" value={values[F.HABILITACOES] ?? ''} onChange={e => updateField(F.HABILITACOES, e.target.value)}>
                  <option value="12ano">12.º Ano</option>
                  <option value="licenciatura">Licenciatura</option>
                  <option value="mestrado">Mestrado</option>
                  <option value="doutoramento">Doutoramento</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="form__group">
                <label className="form__label">CAP / CCP</label>
                <select className="form__input" value={values[F.CAP_CCP] ?? ''} onChange={e => updateField(F.CAP_CCP, e.target.value)}>
                  <option value="sim">Possuo Certificado</option>
                  <option value="nao">Não Possuo</option>
                  <option value="processo">Em Processo</option>
                </select>
              </div>
              <div className="form__group efm-col-2">
                <label className="form__label">Experiência</label>
                <textarea className="form__textarea" rows={2} value={values[F.EXPERIENCIA] ?? ''} onChange={e => updateField(F.EXPERIENCIA, e.target.value)} />
              </div>
            </div>
          </div>

          <div className="efm-section">
            <span className="dm-section-label">Disponibilidade</span>
            <div className="efm-grid">
              <div className="form__group">
                <label className="form__label">Dias</label>
                <input className="form__input" value={values[F.DIAS] ?? ''} onChange={e => updateField(F.DIAS, e.target.value)} placeholder="Ex: Segunda, Terça" />
              </div>
              <div className="form__group">
                <label className="form__label">Períodos</label>
                <input className="form__input" value={values[F.PERIODOS] ?? ''} onChange={e => updateField(F.PERIODOS, e.target.value)} placeholder="Ex: Manhã, Tarde" />
              </div>
              <div className="form__group">
                <label className="form__label">Modalidade</label>
                <select className="form__input" value={values[F.MODALIDADE] ?? ''} onChange={e => updateField(F.MODALIDADE, e.target.value)}>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="hibrida">Híbrida</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="dm-footer" style={{ gap: '0.75rem' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar...' : <><Save size={16} /> Guardar</>}
          </button>
        </div>
      </motion.div>

      <style>{`
        .efm-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .efm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        .efm-col-2 { grid-column: span 2; }
        @media (max-width: 500px) { .efm-grid { grid-template-columns: 1fr; } .efm-col-2 { grid-column: span 1; } }
      `}</style>
    </motion.div>
  );
}
