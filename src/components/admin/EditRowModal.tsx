import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface EditRowModalProps {
  row: { originalIndex: number, cells: any[], type: string };
  headers: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRowModal({ row, headers, onClose, onSuccess }: EditRowModalProps) {
  const [values, setValues] = useState([...row.cells]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const tabName = row.type.charAt(0).toUpperCase() + row.type.slice(1);
    try {
      await apiService.updateRow(tabName, row.originalIndex, values);
      toast.success('Registo atualizado!');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="admin-modal glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>Editar {row.type.slice(0, -1)} #{row.originalIndex}</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="form__grid">
            {headers.map((header, idx) => {
              const h = header.toLowerCase();
              const isLarge = h.includes('mensagem') || h.includes('motivação') || h.includes('notas');
              const type = h.includes('email') ? 'email' : h.includes('tel') ? 'tel' : h.includes('data') ? 'date' : 'text';

              return (
                <div key={idx} className={`form__group ${isLarge ? 'form__group--full' : ''}`}>
                  <label className="form__label">{header}</label>
                  {isLarge ? (
                    <textarea
                      className="form__textarea"
                      rows={3}
                      value={values[idx] || ''}
                      onChange={e => {
                        const v = [...values];
                        v[idx] = e.target.value;
                        setValues(v);
                      }}
                    />
                  ) : (
                    <input 
                      type={type}
                      className="form__input" 
                      value={values[idx] || ''} 
                      onChange={e => {
                        const v = [...values];
                        v[idx] = e.target.value;
                        setValues(v);
                      }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'A guardar...' : <><Save size={18} /> Guardar</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
