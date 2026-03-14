import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Save, Printer, FileDown, X } from 'lucide-react';
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
      toast.success(`Agenda ${room.toUpperCase()} guardada com sucesso!`);
    } catch (err: any) {
      toast.error('Erro ao guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateSlot = (day: string, slot: string, field: 'trainer' | 'course', val: string) => {
    const key = `${day}-${slot}`;
    setAgenda({ 
      ...agenda, 
      [key]: { 
        ...(agenda[key] || { trainer: '', course: '' }), 
        [field]: val 
      } 
    });
  };

  const getAvailableTrainers = (day: string, slot: string) => {
    return formadores.filter(f => {
      const availableDays = f[11]?.split(',').map((d: string) => d.trim()) || [];
      const availableSlots = f[12]?.split(',').map((s: string) => s.trim()) || [];
      if (day === 'Sábado') return availableDays.includes('Sábado');
      const slotName = slot.split(' ')[0];
      return availableDays.includes(day) && availableSlots.some((s: string) => s.includes(slotName));
    });
  };

  const getTrainerCourses = (trainerName: string) => {
    const trainer = formadores.find(f => f[1] === trainerName);
    if (!trainer) return [];
    return trainer[6]?.split(',').map((c: string) => c.trim()) || [];
  };

  return (
    <div className="admin-agenda">
      {/* Room Tabs */}
      <div className="admin-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`admin-tab ${room === 'sala1' ? 'is-active' : ''}`} onClick={() => setRoom('sala1')}>Sala 1</button>
        <button className={`admin-tab ${room === 'sala2' ? 'is-active' : ''}`} onClick={() => setRoom('sala2')}>Sala 2</button>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3>Mapa de Ocupação — {room === 'sala1' ? 'Sala 1' : 'Sala 2'}</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn--outline" onClick={() => setShowPreview(true)}>
              <Eye size={18} /> Visualizar / Imprimir
            </button>
            <button className="btn btn--primary" onClick={saveAgenda} disabled={saving || loading}>
              {saving ? 'A Sincronizar...' : <><Save size={18} /> Sincronizar Mapa</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>
        ) : (
          <div className="agenda-grid">
            {DAYS.map(day => (
              <div key={day} className="agenda-day">
                <div className="agenda-day-header">{day}</div>
                {day === 'Sábado' ? (
                  <div className="agenda-slot agenda-slot--full">
                    <label>Dia Inteiro (09h-18h)</label>
                    <AgendaSlotInputs 
                      day={day} slot="full" agenda={agenda} 
                      trainers={getAvailableTrainers(day, 'full')} 
                      onUpdate={updateSlot} getCourses={getTrainerCourses}
                    />
                  </div>
                ) : (
                  SLOTS.map(slot => (
                    <div key={slot} className="agenda-slot">
                      <label>{slot}</label>
                      <AgendaSlotInputs 
                        day={day} slot={slot} agenda={agenda} 
                        trainers={getAvailableTrainers(day, slot)} 
                        onUpdate={updateSlot} getCourses={getTrainerCourses}
                      />
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <AgendaPreviewModal agenda={agenda} room={room} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AgendaSlotInputs({ day, slot, agenda, trainers, onUpdate, getCourses }: any) {
  const key = `${day}-${slot}`;
  const currentTrainer = agenda[key]?.trainer || '';
  const currentCourse = agenda[key]?.course || '';
  const availableCourses = getCourses(currentTrainer);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <select className="agenda-select" value={currentTrainer} onChange={e => onUpdate(day, slot, 'trainer', e.target.value)}>
        <option value="">— Formador —</option>
        {trainers.map((f: any) => (<option key={f[1]} value={f[1]}>{f[1]}</option>))}
      </select>
      <select className="agenda-select" value={currentCourse} onChange={e => onUpdate(day, slot, 'course', e.target.value)} disabled={!currentTrainer}>
        <option value="">— Curso —</option>
        {availableCourses.map((c: string) => (<option key={c} value={c}>{c}</option>))}
      </select>
    </div>
  );
}

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
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
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
          {/* Paper Sheet */}
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
