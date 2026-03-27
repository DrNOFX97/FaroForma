import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { DM_STYLES } from './DetailModal';

interface EditModalShellProps {
  title: string;
  subtitle: string;
  avatar: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
  extraStyles?: string;
}

export function EditModalShell({ title, subtitle, avatar, saving, onClose, onSave, children, extraStyles }: EditModalShellProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
        tabIndex={-1}
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 600 }}
      >
        <div className="dm-header">
          <div className="dm-header-info">
            <div className="dm-avatar">{avatar || '?'}</div>
            <div>
              <h3 className="dm-name">{title}</h3>
              <span className="dm-meta">{subtitle}</span>
            </div>
          </div>
          <button className="dm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="dm-body" style={{ gap: '1.5rem' }}>
          {children}
        </div>

        <div className="dm-footer" style={{ gap: '0.75rem' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={onSave} disabled={saving}>
            {saving ? 'A guardar...' : <><Save size={16} /> Guardar</>}
          </button>
        </div>
      </motion.div>

      <style>{DM_STYLES + (extraStyles ?? '')}</style>
    </motion.div>
  );
}
