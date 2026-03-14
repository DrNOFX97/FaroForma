import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DetailModalProps {
  data: any;
  onClose: () => void;
}

export function DetailModal({ data, onClose }: DetailModalProps) {
  const isFormador = Array.isArray(data.cells);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        ref={modalRef}
        className="admin-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h3 id="detail-modal-title">Detalhes do Registo {data.originalIndex ? `#${data.originalIndex}` : ''}</h3>
          <button onClick={onClose} className="admin-close-btn" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="detail-grid">
            {isFormador ? (
              // Formadores data is an array
              data.cells.map((val: any, idx: number) => (
                <div key={idx} className="detail-item">
                  <label>Campo {idx}</label>
                  <div>{val || <span className="text-muted">—</span>}</div>
                </div>
              ))
            ) : (
              // Other data (alunos, contactos) might be objects
              Object.entries(data).filter(([key]) => key !== 'originalIndex').map(([key, val]: [string, any]) => (
                <div key={key} className="detail-item">
                  <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{typeof val === 'string' || typeof val === 'number' ? val : JSON.stringify(val)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="btn btn--primary" onClick={onClose}>Fechar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
