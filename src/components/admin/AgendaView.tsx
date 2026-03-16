import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Save, 
  Printer, 
  FileDown, 
  X, 
  Plus, 
  Users, 
  BookOpen, 
  Trash2, 
  Search as SearchIcon,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';
import type { RawData } from '../../services/api';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SLOTS = ['Manhã (09h-13h)', 'Tarde (13h-18h)', 'Noite (18h-21h)'];

interface AgendaViewProps {
  data: RawData | null;
}

export function AgendaView({ data }: AgendaViewProps) {
  const [room, setRoom] = useState('sala1');
  const [agenda, setAgenda] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: string, slot: string } | null>(null);

  const formadores = data?.formadores?.slice(1) || [];

  useEffect(() => {
    fetchAgenda();
  }, [room]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAgenda(room);
      setAgenda(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveAgenda = async () => {
    setSaving(true);
    try {
      await apiService.saveAgenda(room, agenda);
      toast.success(`Agenda ${room.toUpperCase()} guardada!`);
    } catch (err: any) {
      toast.error('Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (day: string, slot: string, trainer: string, course: string) => {
    const key = `${day}-${slot}`;
    if (!trainer && !course) {
      const newAgenda = { ...agenda };
      delete newAgenda[key];
      setAgenda(newAgenda);
    } else {
      setAgenda({ ...agenda, [key]: { trainer, course } });
    }
    setEditingSlot(null);
  };

  // ── Statistics ─────────────────────────────────────────────────────────────
  const totalSlots = (5 * 3) + 1; // Weekdays * slots + Saturday
  const occupiedSlots = Object.keys(agenda).filter(k => agenda[k].trainer).length;
  const occupancyPercent = Math.round((occupiedSlots / totalSlots) * 100);

  return (
    <div className="professional-agenda">
      {/* Header Info */}
      <div className="agenda-header-v2">
        <div className="room-selector-pill glass">
          <button className={room === 'sala1' ? 'is-active' : ''} onClick={() => setRoom('sala1')}>Sala 1</button>
          <button className={room === 'sala2' ? 'is-active' : ''} onClick={() => setRoom('sala2')}>Sala 2</button>
        </div>
        
        <div className="occupancy-info glass">
          <div className="occupancy-label">Taxa de Ocupação</div>
          <div className="occupancy-bar-wrap">
            <div className="occupancy-bar" style={{ width: `${occupancyPercent}%` }} />
          </div>
          <div className="occupancy-value">{occupancyPercent}%</div>
        </div>

        <div className="agenda-actions">
          <button className="btn btn--outline" onClick={() => setShowPreview(true)}>
            <Eye size={18} /> Visualizar PDF
          </button>
          <button className="btn btn--primary" onClick={saveAgenda} disabled={saving || loading}>
            {saving ? 'A guardar...' : <><Save size={18} /> Sincronizar Mapa</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass" style={{ padding: '6rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
      ) : (
        <div className="agenda-workspace">
          <div className="agenda-main-grid">
            {DAYS.map(day => (
              <div key={day} className="day-column">
                <div className="day-title">{day}</div>
                <div className="slots-list">
                  {day === 'Sábado' ? (
                    <AgendaBlock 
                      day={day} slot="full" label="Dia Inteiro (09h-18h)" 
                      data={agenda[`${day}-full`]} 
                      onEdit={() => setEditingSlot({ day, slot: 'full' })} 
                    />
                  ) : (
                    SLOTS.map(slot => (
                      <AgendaBlock 
                        key={slot} day={day} slot={slot} label={slot.split(' ')[0]} 
                        data={agenda[`${day}-${slot}`]} 
                        onEdit={() => setEditingSlot({ day, slot })} 
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pop-over Editor */}
      <AnimatePresence>
        {editingSlot && (
          <AgendaEditorPopOver 
            day={editingSlot.day} 
            slot={editingSlot.slot} 
            currentData={agenda[`${editingSlot.day}-${editingSlot.slot}`]}
            formadores={formadores}
            onClose={() => setEditingSlot(null)}
            onSave={updateSlot}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreview && (
          <AgendaPreviewModal agenda={agenda} room={room} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>

      <style>{AGENDA_STYLES}</style>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function AgendaBlock({ label, data, onEdit }: any) {
  const isOccupied = data && data.trainer;

  return (
    <motion.div 
      className={`agenda-block ${isOccupied ? 'is-occupied' : 'is-empty'}`}
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onEdit}
    >
      <div className="block-label">{label}</div>
      {isOccupied ? (
        <div className="block-content">
          <div className="block-trainer"><Users size={12} /> {data.trainer}</div>
          <div className="block-course"><BookOpen size={12} /> {data.course}</div>
        </div>
      ) : (
        <div className="block-add"><Plus size={16} /> Disponível</div>
      )}
    </motion.div>
  );
}

function AgendaEditorPopOver({ day, slot, currentData, formadores, onClose, onSave }: any) {
  const [trainerSearch, setTrainerSearch] = useState(currentData?.trainer || '');
  const [courseSearch, setCourseSearch] = useState(currentData?.course || '');
  const [customConfirmed, setCustomConfirmed] = useState(false);
  const [step, setStep] = useState(1); // 1: Trainer, 2: Course

  const filteredTrainers = formadores.filter((f: any) => 
    f[1]?.toLowerCase().includes(trainerSearch.toLowerCase())
  ).slice(0, 5);

  const selectedTrainerData = formadores.find((f: any) => f[1] === trainerSearch);
  const availableCourses = selectedTrainerData?.[6]?.split(',').map((c: string) => c.trim()) || [];
  
  const filteredCourses = availableCourses.filter((c: string) => 
    c.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="popover-overlay" onClick={onClose}>
      <motion.div 
        className="popover-card glass" 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="popover-header">
          <div>
            <h4>Agendar: {day}</h4>
            <span>{slot}</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="popover-body">
          {step === 1 ? (
            <div className="search-step">
              <label className="form__label">Selecionar Formador</label>
              <div className="search-input-wrap">
                <SearchIcon size={16} />
                <input 
                  autoFocus 
                  placeholder="Pesquise por nome..." 
                  value={trainerSearch} 
                  onChange={e => setTrainerSearch(e.target.value)} 
                />
              </div>
              <div className="search-results">
                {filteredTrainers.map((f: any) => (
                  <button key={f[1]} className={`result-item ${trainerSearch === f[1] ? 'is-selected' : ''}`} onClick={() => { setTrainerSearch(f[1]); setStep(2); }}>
                    <Users size={14} />
                    <span>{f[1]}</span>
                    {trainerSearch === f[1] && <Check size={14} className="text-accent" />}
                  </button>
                ))}
                {filteredTrainers.length === 0 && <div className="no-results">Nenhum formador encontrado.</div>}
              </div>
            </div>
          ) : (
            <div className="search-step">
              <label className="form__label">Selecionar Curso (de {trainerSearch})</label>
              <div className="search-input-wrap">
                <SearchIcon size={16} />
                <input
                  autoFocus
                  placeholder="Pesquise por curso..."
                  value={courseSearch}
                  onChange={e => { setCourseSearch(e.target.value); setCustomConfirmed(false); }}
                />
              </div>
              <div className="search-results">
                {filteredCourses.map((c: string) => (
                  <button key={c} className={`result-item ${courseSearch === c ? 'is-selected' : ''}`} onClick={() => setCourseSearch(c)}>
                    <BookOpen size={14} />
                    <span>{c}</span>
                    {courseSearch === c && <Check size={14} className="text-accent" />}
                  </button>
                ))}
                <button className={`result-item custom-val ${customConfirmed ? 'is-selected' : ''}`} onClick={() => setCustomConfirmed(true)}>
                  <Plus size={14} /> Usar valor personalizado: "{courseSearch}"
                  {customConfirmed && <Check size={14} className="text-accent" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="popover-footer">
          {step === 2 && <button className="btn btn--link" onClick={() => setStep(1)}>Voltar</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn--outline btn--small text-red" onClick={() => { if (confirm('Limpar este slot?')) onSave(day, slot, '', ''); }}><Trash2 size={14} /> Limpar</button>
          <button className="btn btn--primary btn--small" onClick={() => onSave(day, slot, trainerSearch, courseSearch)}>Confirmar</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reusing existing AgendaPreviewModal with improvements ────────────────────

function AgendaPreviewModal({ agenda, room, onClose }: any) {
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Agenda_${room === 'sala1' ? 'Sala1' : 'Sala2'}_FaroForma.pdf`);
    } catch (err) {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="admin-modal admin-modal--large glass" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
        <div className="admin-modal-header">
          <h3>Pré-visualização do Documento</h3>
          <button onClick={onClose} className="admin-close-btn"><X size={20} /></button>
        </div>
        
        <div className="admin-modal-body" style={{ background: '#f0f0f0', padding: '3rem' }}>
          <div ref={printRef} className="print-sheet">
            <div className="print-header">
              <div className="print-logo">FaroForma</div>
              <div className="print-title">Mapa de Ocupação — {room === 'sala1' ? 'Sala 1' : 'Sala 2'}</div>
              <div className="print-date">Gerado em: {new Date().toLocaleDateString()}</div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Manhã (09h-13h)</th>
                  <th>Tarde (13h-18h)</th>
                  <th>Noite (18h-21h)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td className="print-day-cell">{day}</td>
                    {day === 'Sábado' ? (
                      <td colSpan={3} className="print-full-cell">
                        <div className="print-entry">
                          <strong>{agenda[`${day}-full`]?.trainer || 'Livre'}</strong>
                          <span>{agenda[`${day}-full`]?.course || ''}</span>
                        </div>
                      </td>
                    ) : (
                      SLOTS.map(slot => (
                        <td key={slot}>
                          <div className="print-entry">
                            <strong>{agenda[`${day}-${slot}`]?.trainer || 'Livre'}</strong>
                            <span>{agenda[`${day}-${slot}`]?.course || ''}</span>
                          </div>
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="print-footer">Documento Oficial FaroForma — © {new Date().getFullYear()}</div>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="btn" onClick={onClose}>Fechar</button>
          <button className="btn btn--outline" onClick={handlePrint}>
            <Printer size={18} /> Imprimir
          </button>
          <button className="btn btn--primary" onClick={handleDownloadPDF} disabled={generating}>
            {generating ? 'A gerar PDF...' : <><FileDown size={18} /> Guardar PDF</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const AGENDA_STYLES = `
  .professional-agenda { display: flex; flex-direction: column; gap: 2rem; }
  
  .agenda-header-v2 { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 2.5rem; }
  
  .room-selector-pill { display: flex; padding: 0.4rem; border-radius: 100px; border: 1px solid var(--border); width: fit-content; background: var(--bg-1); }
  .room-selector-pill button { padding: 0.5rem 1.5rem; border-radius: 100px; border: none; background: transparent; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
  .room-selector-pill button.is-active { background: var(--bg); color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

  .occupancy-info { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.5rem; border-radius: 100px; }
  .occupancy-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; }
  .occupancy-bar-wrap { flex: 1; height: 8px; background: var(--bg-2); border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
  .occupancy-bar { height: 100%; background: var(--accent); border-radius: 10px; transition: width 1s ease-out; }
  .occupancy-value { font-size: 0.9rem; font-weight: 800; color: var(--accent); min-width: 40px; }

  .agenda-actions { display: flex; gap: 0.75rem; }

  /* Grid Layout */
  .agenda-workspace { padding-bottom: 2rem; }
  .agenda-main-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
  
  .day-column { display: flex; flex-direction: column; gap: 1rem; }
  .day-title { text-align: center; font-weight: 800; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border); }
  
  .slots-list { display: flex; flex-direction: column; gap: 0.75rem; }
  
  .agenda-block { padding: 1.25rem 1rem; border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; gap: 0.75rem; transition: all 0.2s; min-height: 110px; }
  
  .agenda-block.is-empty { border: 2px dashed var(--border); background: transparent; justify-content: center; align-items: center; color: var(--text-dim); }
  .agenda-block.is-empty:hover { border-color: var(--accent); color: var(--accent); background: rgba(16, 185, 129, 0.02); }
  .block-add { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; }

  .agenda-block.is-occupied { border: 1px solid var(--border); background: var(--bg-1); box-shadow: var(--shadow-sm); }
  .agenda-block.is-occupied:hover { border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
  
  .block-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-dim); opacity: 0.7; }
  .is-occupied .block-label { color: var(--accent); opacity: 1; }
  
  .block-content { display: flex; flex-direction: column; gap: 0.4rem; }
  .block-trainer { font-size: 0.85rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 0.4rem; }
  .block-course { font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; line-height: 1.3; }

  /* Saturday Special */
  .day-column:last-child .agenda-block { min-height: 345px; }

  /* Popover Editor */
  .popover-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem; }
  .popover-card { width: 100%; max-width: 440px; border-radius: var(--radius-xl); overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
  
  .popover-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; }
  .popover-header h4 { margin: 0; font-size: 1.1rem; }
  .popover-header span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
  
  .popover-body { padding: 1.5rem; min-height: 320px; }
  .search-input-wrap { position: relative; margin-bottom: 1.25rem; }
  .search-input-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .search-input-wrap input { width: 100%; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem 0.75rem 2.5rem; color: var(--text); font-size: 0.9rem; }
  .search-input-wrap input:focus { border-color: var(--accent); outline: none; }

  .search-results { display: flex; flex-direction: column; gap: 0.5rem; }
  .result-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text); font-size: 0.85rem; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.2s; }
  .result-item:hover { background: var(--bg-2); border-color: var(--border); }
  .result-item.is-selected { background: rgba(16, 185, 129, 0.1); color: var(--accent); border-color: var(--accent); }
  .result-item svg { color: var(--text-dim); }
  .result-item.is-selected svg { color: var(--accent); }
  .result-item.custom-val { margin-top: 0.5rem; border-top: 1px solid var(--border); border-radius: 0; padding-top: 1rem; color: var(--text-muted); font-style: italic; }

  .popover-footer { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); background: var(--bg-1); display: flex; align-items: center; gap: 1rem; }
  .text-red { color: #ef4444 !important; }

  @media (max-width: 1200px) {
    .agenda-main-grid { grid-template-columns: repeat(3, 1fr); }
    .day-column:last-child .agenda-block { min-height: 110px; }
  }
  @media (max-width: 768px) {
    .agenda-main-grid { grid-template-columns: 1fr; }
    .agenda-header-v2 { grid-template-columns: 1fr; gap: 1rem; }
    .occupancy-info { order: 3; }
  }
`;
