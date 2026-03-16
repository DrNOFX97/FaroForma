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

  const updateField = (idx: number, val: any) => {
    setValues(prev => prev.map((v, i) => i === idx ? val : v));
  };
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
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
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={modalRef}
        className="admin-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 id="edit-modal-title">Editar Formador #{row.originalIndex}</h3>
          <button onClick={onClose} className="admin-close-btn" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="form__grid">
            <div className="form__group"><label className="form__label">Nome</label><input className="form__input" value={values[F.NOME]} onChange={e => updateField(F.NOME, e.target.value)} /></div>
            <div className="form__group"><label className="form__label">Email</label><input className="form__input" value={values[F.EMAIL]} onChange={e => updateField(F.EMAIL, e.target.value)} /></div>
            <div className="form__group"><label className="form__label">Telefone</label><input className="form__input" value={values[F.TELEFONE]} onChange={e => updateField(F.TELEFONE, e.target.value)} /></div>
            <div className="form__group"><label className="form__label">Áreas</label><input className="form__input" value={values[F.AREAS]} onChange={e => updateField(F.AREAS, e.target.value)} /></div>
            <div className="form__group">
              <label className="form__label">Habilitações</label>
              <select className="form__input" value={values[F.HABILITACOES]} onChange={e => updateField(F.HABILITACOES, e.target.value)}>
                <option value="12ano">12.º Ano</option><option value="licenciatura">Licenciatura</option><option value="mestrado">Mestrado</option><option value="doutoramento">Doutoramento</option><option value="outro">Outro</option>
              </select>
            </div>
            <div className="form__group">
              <label className="form__label">CAP / CCP</label>
              <select className="form__input" value={values[F.CAP_CCP]} onChange={e => updateField(F.CAP_CCP, e.target.value)}>
                <option value="sim">Possuo Certificado</option><option value="nao">Não Possuo</option><option value="processo">Em Processo</option>
              </select>
            </div>
            <div className="form__group"><label className="form__label">Dias</label><input className="form__input" value={values[F.DIAS]} onChange={e => updateField(F.DIAS, e.target.value)} placeholder="Ex: Segunda, Terça" /></div>
            <div className="form__group"><label className="form__label">Períodos</label><input className="form__input" value={values[F.PERIODOS]} onChange={e => updateField(F.PERIODOS, e.target.value)} placeholder="Ex: Manhã, Tarde" /></div>
            <div className="form__group">
              <label className="form__label">Modalidade</label>
              <select className="form__input" value={values[F.MODALIDADE]} onChange={e => updateField(F.MODALIDADE, e.target.value)}>
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
