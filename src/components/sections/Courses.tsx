import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Users, Award, Clock, 
  Layers, Monitor, Target, Check 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AnimatedSection from '../ui/AnimatedSection';
import { COURSE_INFO as DEFAULT_COURSE_INFO } from '../../data/courses';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';

const ICONS_MAP: Record<string, any> = {
  MessageCircle: <MessageCircle size={20} />,
  Users: <Users size={20} />,
  Award: <Award size={20} />,
  Target: <Target size={20} />,
  Clock: <Clock size={20} />,
  Layers: <Layers size={20} />,
  Monitor: <Monitor size={20} />,
};

const PERIOD_MAP: Record<string, { pt: string, en: string }> = {
  manha: { pt: 'Manhã', en: 'Morning' },
  tarde: { pt: 'Tarde', en: 'Afternoon' },
  noite: { pt: 'Noite', en: 'Evening' },
  sabado: { pt: 'Sábado', en: 'Saturday' },
};

export default function Courses() {
  const { language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [modalOpen, setModalOpen] = useState(false);
  const [courseData, setCourseData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    level: '',
    needsTransport: false,
  });
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = async () => {
    try {
      const data = await apiService.getCourses();
      if (data && data.length > 0) {
        setCourseData(data[0]);
        const firstSlot = data[0].schedule?.[0];
        if (firstSlot) {
          setFormData(prev => ({ ...prev, level: firstSlot.turma?.pt || firstSlot.turma || '' }));
        }
      } else {
        setCourseData(DEFAULT_COURSE_INFO);
      }
    } catch (err) {
      setCourseData(DEFAULT_COURSE_INFO);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.submitStudent({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        program: courseData.title[language],
        turma: formData.level,
        startDate: new Date().toISOString().split('T')[0],
        contactPreference: 'Email/Phone',
        needsTransport: formData.needsTransport,
        notes: `Inscrição via site (Cursos): ${formData.level}`,
      });
      setFormSuccess(true);
    } catch (err) {
      toast.error('Erro ao enviar inscrição. Por favor tente novamente.');
    }
  };

  if (!courseData) return null;

  return (
    <section className="section section--alt" id="cursos">
      <div className="container">
        <motion.div
          ref={ref}
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="tag">{language === 'pt' ? 'Cursos' : 'Courses'}</span>
          <h2>
            {courseData.title[language]}<br />
            <span className="gradient-text">{courseData.subtitle?.[language] || ''}</span>
          </h2>
          <p>
            {courseData.description[language]}<br />
            <span className="status-highlight">{courseData.status[language]}</span>
          </p>
        </motion.div>

        {/* 3 Cartões de Destaque */}
        <div className="courses__highlight-cards">
          {(courseData.highlights || []).slice(0, 3).map((item: any, i: number) => (
            <AnimatedSection key={i} direction="up" delay={0.1 * i} className="course-card-wrap">
              <div className="course-feat-card glass">
                <div className="course-feat-icon">
                  {ICONS_MAP[item.icon] || <Check size={20} />}
                </div>
                <p>{item.text[language]}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <div className="courses__main-content">
          <AnimatedSection direction="up" delay={0.3}>
            <div className="courses__schedule-box glass">
              <div className="schedule-header">
                <Clock size={20} className="text-accent" />
                <h3>{language === 'pt' ? 'Horários das Turmas' : 'Class Schedules'}</h3>
              </div>
              
              <div className="courses__table-responsive">
                <table className="course-schedule-table">
                  <thead>
                    <tr>
                      <th>{language === 'pt' ? 'Turma' : 'Class'}</th>
                      <th>{language === 'pt' ? 'Período' : 'Period'}</th>
                      <th>{language === 'pt' ? 'Horário' : 'Schedule'}</th>
                      <th>{language === 'pt' ? 'Dias' : 'Days'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(courseData.schedule || []).map((slot: any, i: number) => (
                      <tr key={i}>
                        <td className="col-turma"><strong>{slot.turma?.pt || slot.turma}</strong></td>
                        <td className="col-periodo">{PERIOD_MAP[slot.periodo]?.[language] || slot.período?.[language] || '—'}</td>
                        <td className="col-horario">
                          {Array.isArray(slot.horario) ? slot.horario.join(' / ') : slot.horário}
                        </td>
                        <td className="col-dias">
                          {Array.isArray(slot.dias) ? slot.dias.join(', ') : (slot.dias?.[language] || slot.dias)}
                          {slot.diasExtra?.[language] && (
                            <span className="dias-extra"> ({slot.diasExtra[language]})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="courses__cta-area">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => {
                    setModalOpen(true);
                    setFormSuccess(false);
                  }}
                >
                  {language === 'pt' ? 'Garantir a minha vaga' : 'Secure my spot'}
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Modal remains similar but updated for new data structure if needed */}
        <AnimatePresence>
          {modalOpen && (
            <div className="modal-overlay" onClick={() => setModalOpen(false)}>
              <motion.div 
                className="modal-card glass" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
              >
                <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Fechar">×</button>
                <h3>{language === 'pt' ? 'Formulário de Inscrição' : 'Enrolment Form'}</h3>
                {formSuccess ? (
                  <div className="modal-success">
                    <div className="success-icon"><Check size={32} /></div>
                    <p>{language === 'pt' ? 'Inscrição recebida! Entraremos em contacto brevemente.' : 'Enrolment received! We will be in touch soon.'}</p>
                    <button type="button" className="btn btn--primary" onClick={() => setModalOpen(false)}>Fechar</button>
                  </div>
                ) : (
                  <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form__group">
                      <label>{language === 'pt' ? 'Nome completo' : 'Full name'}</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="form__grid">
                      <div className="form__group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </div>
                      <div className="form__group">
                        <label>{language === 'pt' ? 'Telemóvel' : 'Mobile'}</label>
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="form__group">
                      <label>{language === 'pt' ? 'Turma pretendida' : 'Preferred Class'}</label>
                      <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                        {(courseData.schedule || []).map((slot: any, i: number) => (
                          <option key={i} value={slot.turma?.pt || slot.turma}>
                            {slot.turma?.pt || slot.turma} · {PERIOD_MAP[slot.periodo]?.[language] || '—'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="modal-form__checkbox">
                      <input type="checkbox" checked={formData.needsTransport} onChange={e => setFormData({...formData, needsTransport: e.target.checked})} />
                      <span>{language === 'pt' ? 'Necessito de transporte (+2,50 €/dia)' : 'I need transport (+€2.50/day)'}</span>
                    </label>
                    <button type="submit" className="btn btn--primary btn--lg btn--full">{language === 'pt' ? 'Enviar Inscrição' : 'Submit Enrolment'}</button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .status-highlight { color: var(--accent); font-weight: 700; font-size: 0.9rem; }
        
        .courses__highlight-cards { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 1.5rem; 
          margin-bottom: 3rem; 
        }
        .course-feat-card { 
          padding: 2rem; 
          text-align: center; 
          border-radius: 20px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 1rem;
          height: 100%;
          transition: transform 0.3s ease;
        }
        .course-feat-card:hover { transform: translateY(-5px); }
        .course-feat-icon { 
          width: 48px; height: 48px; 
          background: rgba(var(--accent-rgb), 0.1); 
          color: var(--accent); 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center; 
        }
        .course-feat-card p { font-size: 0.9rem; font-weight: 600; color: var(--text); margin: 0; }

        .courses__schedule-box { padding: 2.5rem; border-radius: 24px; }
        .schedule-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2rem; }
        .schedule-header h3 { margin: 0; font-size: 1.5rem; }

        .course-schedule-table { width: 100%; border-collapse: collapse; text-align: left; }
        .course-schedule-table th { padding: 1rem; border-bottom: 2px solid var(--border); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); }
        .course-schedule-table td { padding: 1.25rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.95rem; }
        .dias-extra { font-size: 0.8rem; color: var(--text-muted); font-style: italic; }

        .courses__cta-area { margin-top: 2.5rem; display: flex; justify-content: center; }

        @media (max-width: 1024px) {
          .courses__highlight-cards { grid-template-columns: 1fr; gap: 1rem; }
        }
        @media (max-width: 768px) {
          .course-schedule-table thead { display: none; }
          .course-schedule-table tr { display: block; padding: 1rem 0; }
          .course-schedule-table td { display: block; padding: 0.25rem 0; border: none; }
          .col-turma { font-size: 1.1rem; color: var(--accent); }
        }
      `}</style>
    </section>
  );
}
